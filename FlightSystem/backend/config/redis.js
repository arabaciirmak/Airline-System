const redis = require('redis');
require('dotenv').config();

let redisClient = null;

try {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });

  redisClient.on('error', (err) => {
    console.log('Redis not available, continuing without cache');
    redisClient = null;
  });
  
  redisClient.on('connect', () => console.log('Redis Client Connected'));

  redisClient.connect().catch(() => {
    console.log('Redis connection failed, continuing without cache');
    redisClient = null;
  });
} catch (error) {
  console.log('Redis initialization failed, continuing without cache');
  redisClient = null;
}

module.exports = redisClient;
