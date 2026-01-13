const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.ML_SERVICE_PORT || 3006;

app.use(cors());
app.use(express.json());

app.post('/predict', (req, res) => {
  try {
    const { fromCity, toCity, duration, date } = req.body;

    if (!duration) {
      return res.status(400).json({ error: 'Duration is required' });
    }

    // Base price calculation
    const basePrice = 500;
    const durationHours = duration / 60;
    
    // Distance multiplier (simplified)
    const distanceMultiplier = durationHours * 1.5;
    
    // Date-based pricing
    const flightDate = new Date(date);
    const month = flightDate.getMonth();
    const dayOfWeek = flightDate.getDay();
    
    // Peak season (summer months)
    const isPeakSeason = month >= 5 && month <= 7;
    const seasonMultiplier = isPeakSeason ? 1.3 : 1.0;
    
    // Weekend pricing
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.2 : 1.0;
    
    // Route popularity (simplified - could be enhanced with historical data)
    const popularRoutes = [
      ['Istanbul', 'Ankara'],
      ['Istanbul', 'Izmir'],
      ['Ankara', 'Istanbul']
    ];
    const isPopularRoute = popularRoutes.some(route => 
      (route[0] === fromCity && route[1] === toCity) ||
      (route[0] === toCity && route[1] === fromCity)
    );
    const routeMultiplier = isPopularRoute ? 1.1 : 1.0;
    
    // Calculate predicted price
    const predictedPrice = Math.round(
      basePrice * distanceMultiplier * seasonMultiplier * weekendMultiplier * routeMultiplier
    );

    res.json({ price: predictedPrice });
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ml-service' });
});

app.listen(PORT, () => {
  console.log(`ML Service running on port ${PORT}`);
});

module.exports = app;
