const express = require('express');
const cors = require('cors');
const { connectQueue, consumeMessage, QUEUE_NAMES } = require('../../config/queue');
const { sendEmail, getWelcomeEmailTemplate, getMilesAddedEmailTemplate } = require('../../config/email');
const { Member, Booking, Flight } = require('../../models');
require('dotenv').config();

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3005;

app.use(cors());
app.use(express.json());

// Initialize queue connection
let queueInitialized = false;

async function initializeQueues() {
  if (!queueInitialized) {
    await connectQueue();
    queueInitialized = true;
    
    // Consume new member queue
    consumeMessage(QUEUE_NAMES.NEW_MEMBER, async (message) => {
  try {
    const { memberId, memberNumber, email, firstName } = message;
    
    const html = getWelcomeEmailTemplate(firstName, memberNumber);
    await sendEmail(email, 'Welcome to Miles&Smiles!', html);
    
      console.log(`Welcome email sent to ${email}`);
    } catch (error) {
      console.error('New member notification error:', error);
    }
    });

    // Consume booking queue
    consumeMessage(QUEUE_NAMES.BOOKING, async (message) => {
  try {
    const { bookingId, bookingNumber, flightId, memberId } = message;
    
    const booking = await Booking.findByPk(bookingId, {
      include: [
        { model: Flight, as: 'Flight' },
        { model: Member, as: 'Member' }
      ]
    });

    if (booking && booking.Member) {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002060;">Booking Confirmation</h2>
          <p>Dear ${booking.passengerFirstName},</p>
          <p>Your booking has been confirmed!</p>
          <p><strong>Booking Number:</strong> ${bookingNumber}</p>
          <p><strong>Flight:</strong> ${booking.Flight.flightCode}</p>
          <p><strong>Route:</strong> ${booking.Flight.fromCity} → ${booking.Flight.toCity}</p>
          <p><strong>Date:</strong> ${new Date(booking.Flight.flightDate).toLocaleDateString()}</p>
          <p><strong>Passengers:</strong> ${booking.numberOfPassengers}</p>
          <p><strong>Total Price:</strong> ${booking.totalPrice} TL</p>
          <p>Thank you for choosing Yaşar Airlines!</p>
        </div>
      `;
      
      await sendEmail(booking.Member.email, 'Booking Confirmation', html);
      console.log(`Booking confirmation sent for ${bookingNumber}`);
    }
    } catch (error) {
      console.error('Booking notification error:', error);
    }
    });

    // Consume miles added queue
    consumeMessage(QUEUE_NAMES.MILES_ADDED, async (message) => {
  try {
    const { memberId, milesAdded, totalMiles } = message;
    
    const member = await Member.findByPk(memberId);
    if (member) {
      const html = getMilesAddedEmailTemplate(
        member.firstName,
        milesAdded,
        totalMiles
      );
      await sendEmail(member.email, 'Miles Added to Your Account', html);
      console.log(`Miles notification sent to ${member.email}`);
    }
    } catch (error) {
      console.error('Miles notification error:', error);
    }
    });
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  await initializeQueues();
});

module.exports = app;
