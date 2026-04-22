import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = createClient({
  url: REDIS_URL,
});

redisClient.on('error', (err) => {
  logger.error({ err, REDIS_URL }, 'Redis Client Error');
});

redisClient.on('connect', () => {
  logger.info({ REDIS_URL }, 'Redis Client Connected');
});

// Immediately connect to Redis
// In a production app, you might want to wait for this in the server startup
(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error({ err }, 'Failed to connect to Redis initially');
  }
})();
