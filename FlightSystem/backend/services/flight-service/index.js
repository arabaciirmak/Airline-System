const express = require('express');
const cors = require('cors');
const { Flight, sequelize } = require('../../models');
const { Op } = require('sequelize');
const { authenticate } = require('../../middleware/auth');
let redisClient;
try {
  redisClient = require('../../config/redis');
} catch (e) {
  redisClient = null;
}
require('dotenv').config();

const app = express();
const PORT = process.env.FLIGHT_SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

// Cache airport names and destinations
const CACHE_KEYS = {
  AIRPORTS: 'airports:list',
  DESTINATIONS: 'destinations:list'
};

// Initialize cache with airport data
async function initializeCache() {
  if (!redisClient) return;
  try {
    const airports = await Flight.findAll({
      attributes: ['fromCity', 'toCity'],
      raw: true
    });
    
    const uniqueAirports = [...new Set(airports.flatMap(f => [f.fromCity, f.toCity]))];
    await redisClient.setEx(CACHE_KEYS.AIRPORTS, 3600, JSON.stringify(uniqueAirports));
    
    const destinations = await Flight.findAll({
      attributes: ['toCity'],
      group: ['toCity'],
      raw: true
    });
    await redisClient.setEx(CACHE_KEYS.DESTINATIONS, 3600, JSON.stringify(destinations.map(d => d.toCity)));
  } catch (error) {
    console.error('Cache initialization error:', error);
  }
}

// GET /api/v1/Flight/search
app.get('/api/v1/Flight/search', async (req, res) => {
  try {
    const { from, to, date, passengers = 1, direct, flexible } = req.query;

    if (!from || !to || !date) {
      return res.status(400).json({ error: 'Missing required parameters: from, to, date' });
    }

    const searchDate = new Date(date);
    const whereClause = {
      fromCity: from,
      toCity: to,
      availableSeats: { [Op.gte]: parseInt(passengers) }
    };

    // Handle flexible dates (±3 days)
    if (flexible === 'true') {
      const startDate = new Date(searchDate);
      startDate.setDate(startDate.getDate() - 3);
      const endDate = new Date(searchDate);
      endDate.setDate(endDate.getDate() + 3);
      
      whereClause.flightDate = {
        [Op.between]: [startDate, endDate]
      };
    } else {
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.flightDate = {
        [Op.gte]: startOfDay,
        [Op.lt]: endOfDay
      };
    }

    // Direct flight filter
    if (direct === 'true') {
      whereClause.isDirect = true;
    }

    const flights = await Flight.findAll({
      where: whereClause,
      order: [['price', 'ASC']],
      limit: 50
    });

    res.json({ flights });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/Flight/:id
app.get('/api/v1/Flight/:id', async (req, res) => {
  try {
    const flight = await Flight.findByPk(req.params.id);
    if (!flight) {
      return res.status(404).json({ error: 'Flight not found' });
    }
    res.json({ flight });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/Flight/airports (cached)
app.get('/api/v1/Flight/airports', async (req, res) => {
  try {
    // Get from database directly
    const flights = await Flight.findAll({
      attributes: ['fromCity', 'toCity'],
      raw: true
    }).catch(() => []);
    
    let uniqueAirports = [];
    if (flights && flights.length > 0) {
      uniqueAirports = [...new Set(flights.flatMap(f => [f.fromCity, f.toCity]))].filter(c => c && c.trim() !== '').sort();
    }
    
    // If no airports from DB, use fallback
    if (uniqueAirports.length === 0) {
      uniqueAirports = [
        'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bodrum',
        'London', 'Paris', 'Dubai', 'Delhi', 'Mumbai',
        'New York', 'Tokyo', 'Berlin', 'Rome', 'Madrid'
      ];
    }
    
    // Try to cache (non-blocking) if redis available
    if (redisClient) {
      redisClient.get(CACHE_KEYS.AIRPORTS).catch(() => {});
      redisClient.setEx(CACHE_KEYS.AIRPORTS, 3600, JSON.stringify(uniqueAirports)).catch(() => {});
    }
    
    return res.json({ airports: uniqueAirports });
  } catch (error) {
    console.error('Airports error:', error.message);
    // Fallback to static list
    const fallbackCities = [
      'Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bodrum',
      'London', 'Paris', 'Dubai', 'Delhi', 'Mumbai',
      'New York', 'Tokyo', 'Berlin', 'Rome', 'Madrid'
    ];
    return res.json({ airports: fallbackCities });
  }
});

// GET /api/v1/Flight/destinations (cached)
app.get('/api/v1/Flight/destinations', async (req, res) => {
  try {
    const cached = await redisClient.get(CACHE_KEYS.DESTINATIONS);
    if (cached) {
      return res.json({ destinations: JSON.parse(cached) });
    }
    
    await initializeCache();
    const destinations = await redisClient.get(CACHE_KEYS.DESTINATIONS);
    res.json({ destinations: JSON.parse(destinations) });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, async () => {
  console.log(`Flight Service running on port ${PORT}`);
  await initializeCache();
});

module.exports = app;
