const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { Flight } = require('../../models');
const { authenticate, requireAdmin } = require('../../middleware/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.ADMIN_SERVICE_PORT || 3004;

// CORS configuration - allow all for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

app.use(express.json());

// POST /api/v1/Admin/predict-price
// Temporarily disable auth for testing - REMOVE IN PRODUCTION
app.post('/api/v1/Admin/predict-price', async (req, res) => {
  try {
    const { fromCity, toCity, durationMinutes, flightDate } = req.body;

    console.log('Predict request received:', { fromCity, toCity, durationMinutes, flightDate });

    if (!fromCity || !toCity || !durationMinutes || !flightDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Call ML service for price prediction
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:3006';
    try {
      console.log('Calling ML service:', `${mlServiceUrl}/predict`);
      const mlResponse = await axios.post(`${mlServiceUrl}/predict`, {
        fromCity,
        toCity,
        duration: durationMinutes,
        date: flightDate
      }, { timeout: 10000 });

      console.log('ML service response:', mlResponse.data);
      return res.json({ predictedPrice: mlResponse.data.price });
    } catch (mlError) {
      console.error('ML Service error:', mlError.message);
      // Fallback: Simple price calculation
      const basePrice = 500;
      const durationMultiplier = durationMinutes / 60;
      const date = new Date(flightDate);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const weekendMultiplier = isWeekend ? 1.2 : 1.0;
      
      const predictedPrice = Math.round(basePrice * durationMultiplier * weekendMultiplier);
      console.log('Using fallback, predicted price:', predictedPrice);
      
      return res.json({ predictedPrice });
    }
  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/v1/Admin/save-flight
// Temporarily disable auth for testing
app.post('/api/v1/Admin/save-flight', async (req, res) => {
  try {
    const {
      flightCode,
      fromCity,
      toCity,
      flightDate,
      duration,
      capacity,
      price,
      isDirect = true
    } = req.body;

    if (!flightCode || !fromCity || !toCity || !flightDate || !duration || !capacity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if flight code already exists for this date
    const existingFlight = await Flight.findOne({
      where: {
        flightCode,
        flightDate: new Date(flightDate)
      }
    });

    if (existingFlight) {
      return res.status(400).json({ error: 'Flight with this code already exists for this date' });
    }

    console.log('Creating flight with data:', {
      flightCode,
      fromCity,
      toCity,
      flightDate: new Date(flightDate),
      duration: parseInt(duration),
      capacity: parseInt(capacity),
      price: parseFloat(price)
    });

    // Test database connection first
    try {
      await Flight.sequelize.authenticate();
      console.log('Database connection OK');
    } catch (dbError) {
      console.error('Database connection failed:', dbError.message);
      return res.status(500).json({ 
        error: 'Database connection failed', 
        details: 'Please check database configuration. Docker postgres might not be accessible.',
        hint: 'Try: docker-compose restart postgres'
      });
    }

    const flight = await Flight.create({
      flightCode,
      fromCity,
      toCity,
      flightDate: new Date(flightDate),
      duration: parseInt(duration),
      capacity: parseInt(capacity),
      availableSeats: parseInt(capacity),
      price: parseFloat(price),
      isDirect: isDirect === true || isDirect === 'true'
    });

    console.log('Flight created successfully:', flight.id);

    res.status(201).json({
      id: flight.id,
      flightCode: flight.flightCode,
      message: 'Flight saved successfully'
    });
  } catch (error) {
    console.error('Save flight error:', error.message);
    console.error('Error details:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/v1/Admin/flights
app.get('/api/v1/Admin/flights', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Flight.findAndCountAll({
      limit: parseInt(limit),
      offset,
      order: [['flightDate', 'DESC']]
    });

    res.json({
      flights: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});

module.exports = app;
