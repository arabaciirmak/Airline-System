const express = require('express');
const cors = require('cors');
const { Flight, Member, Booking, MilesTransaction } = require('../../models');
const { authenticate } = require('../../middleware/auth');
const { publishMessage, QUEUE_NAMES } = require('../../config/queue');
const { Op } = require('sequelize');
require('dotenv').config();

const app = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 3003;

app.use(cors());
app.use(express.json());

// Generate unique booking number
function generateBookingNumber() {
  return 'BK' + Date.now().toString().slice(-10) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
}

// POST /api/v1/Booking/create
app.post('/api/v1/Booking/create', authenticate, async (req, res) => {
  try {
    const {
      flightId,
      passengerFirstName,
      passengerMiddleName,
      passengerLastName,
      passengerDateOfBirth,
      numberOfPassengers = 1,
      useMiles = false,
      createMember = false
    } = req.body;

    if (!flightId || !passengerFirstName || !passengerLastName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get flight
    const flight = await Flight.findByPk(flightId);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }

    // Check capacity
    if (flight.availableSeats < numberOfPassengers) {
      return res.status(400).json({ error: 'Not enough seats available' });
    }

    // Get or create member
    let member = null;
    if (req.user && req.user.sub) {
      member = await Member.findOne({
        where: { cognitoUserId: req.user.sub }
      });

      // Create member if requested
      if (!member && createMember) {
        const memberNumber = 'MS' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        member = await Member.create({
          memberNumber,
          cognitoUserId: req.user.sub,
          firstName: passengerFirstName,
          middleName: passengerMiddleName,
          lastName: passengerLastName,
          dateOfBirth: passengerDateOfBirth ? new Date(passengerDateOfBirth) : null,
          email: req.user.email,
          milesPoints: 0
        });

        // Add to queue for welcome email
        await publishMessage(QUEUE_NAMES.NEW_MEMBER, {
          memberId: member.id,
          memberNumber: member.memberNumber,
          email: member.email,
          firstName: member.firstName
        });
      }
    }

    // Calculate price
    let totalPrice = flight.price * numberOfPassengers;
    let milesUsed = 0;
    let paidWithMiles = false;

    // Check if paying with miles
    if (useMiles && member && member.milesPoints >= totalPrice) {
      milesUsed = Math.floor(totalPrice);
      member.milesPoints -= milesUsed;
      await member.save();
      totalPrice = 0;
      paidWithMiles = true;

      // Record miles transaction
      await MilesTransaction.create({
        memberId: member.id,
        miles: -milesUsed,
        transactionType: 'used',
        description: `Used for booking ${flight.flightCode}`
      });
    }

    // Create booking
    const bookingNumber = generateBookingNumber();
    const booking = await Booking.create({
      bookingNumber,
      flightId: flight.id,
      memberId: member ? member.id : null,
      cognitoUserId: req.user ? req.user.sub : null,
      passengerFirstName,
      passengerMiddleName,
      passengerLastName,
      passengerDateOfBirth: passengerDateOfBirth ? new Date(passengerDateOfBirth) : null,
      numberOfPassengers,
      totalPrice,
      paidWithMiles,
      milesUsed,
      status: 'confirmed'
    });

    // Reduce flight capacity
    flight.availableSeats -= numberOfPassengers;
    await flight.save();

    // Add to queue for notification
    await publishMessage(QUEUE_NAMES.BOOKING, {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      flightId: flight.id,
      memberId: member ? member.id : null
    });

    res.status(201).json({
      bookingNumber: booking.bookingNumber,
      totalPrice: totalPrice,
      milesUsed: milesUsed,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/Booking/:bookingNumber
app.get('/api/v1/Booking/:bookingNumber', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { bookingNumber: req.params.bookingNumber },
      include: [
        { model: Flight, as: 'Flight' },
        { model: Member, as: 'Member' }
      ]
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/Booking/user/bookings
app.get('/api/v1/Booking/user/bookings', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { cognitoUserId: req.user.sub },
      include: [{ model: Flight, as: 'Flight' }],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});

module.exports = app;
