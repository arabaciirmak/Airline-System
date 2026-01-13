const { sequelize, Flight, Member, Booking, MilesTransaction } = require('../models');

async function initializeDatabase() {
  try {
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established.');

    // Sync models (create tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');

    console.log('Database initialization completed.');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

initializeDatabase();
