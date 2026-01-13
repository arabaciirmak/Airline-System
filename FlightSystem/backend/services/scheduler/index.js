const cron = require('node-cron');
const { Booking, Flight, Member, MilesTransaction } = require('../../models');
const { connectQueue, publishMessage, QUEUE_NAMES } = require('../../config/queue');
const { Op } = require('sequelize');
require('dotenv').config();

// Initialize queue connection
(async () => {
  await connectQueue();
})();

// Calculate miles based on flight price (1 mile per 1 TL)
function calculateMiles(price) {
  return Math.floor(price);
}

// Nightly job: Add miles for completed flights
// Runs every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Running nightly miles update job...');
  
  try {
    // Get all bookings for flights that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.findAll({
      where: {
        flightCompleted: false,
        status: 'confirmed'
      },
      include: [
        {
          model: Flight,
          where: {
            flightDate: {
              [Op.lt]: yesterday
            }
          }
        },
        {
          model: Member
        }
      ]
    });

    for (const booking of bookings) {
      if (booking.memberId && booking.Flight) {
        const milesToAdd = calculateMiles(booking.totalPrice);
        
        // Add miles to member
        const member = await Member.findByPk(booking.memberId);
        if (member) {
          member.milesPoints += milesToAdd;
          await member.save();

          // Create transaction record
          await MilesTransaction.create({
            memberId: member.id,
            bookingId: booking.id,
            miles: milesToAdd,
            transactionType: 'earned',
            description: `Miles earned from flight ${booking.Flight.flightCode}`
          });

          // Mark booking as completed
          booking.flightCompleted = true;
          await booking.save();

          // Add to queue for email notification
          await publishMessage(QUEUE_NAMES.MILES_ADDED, {
            memberId: member.id,
            milesAdded: milesToAdd,
            totalMiles: member.milesPoints
          });

          console.log(`Added ${milesToAdd} miles to member ${member.memberNumber}`);
        }
      }
    }

    console.log(`Miles update job completed. Processed ${bookings.length} bookings.`);
  } catch (error) {
    console.error('Miles update job error:', error);
  }
});

// Process new member queue (runs every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  console.log('Processing new member queue...');
  // This is handled by the notification service consumer
});

console.log('Scheduler service started. Jobs will run as scheduled.');

// Keep the process alive
setInterval(() => {}, 1000);
