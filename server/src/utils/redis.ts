import { createClient } from 'redis';
import { logger } from './logger.js';

const REDIS_URL = process.env.REDIS_URL;

/**
 * Resilient Redis Client.
 * Only initializes and connects if REDIS_URL is provided.
 * Ensures the app remains functional even if a cache layer is missing.
 */
type RedisClient = {
  isOpen: boolean;
  on: (event: string, listener: (err: unknown) => void) => void;
  get: (key: string) => Promise<string | null>;
  setEx: (key: string, seconds: number, value: string) => Promise<void>;
  incr: (key: string) => Promise<number | void>;
  connect: () => Promise<void>;
};

let redisClient: RedisClient;

if (REDIS_URL) {
  const client = createClient({
    url: REDIS_URL,
  });

  client.on('error', (err) => {
    logger.error({ err, REDIS_URL }, 'Redis Client Error');
  });

  client.on('connect', () => {
    logger.info({ REDIS_URL }, 'Redis Client Connected');
  });

  redisClient = client as unknown as RedisClient;

  // Self-invoking connection logic
  (async () => {
    try {
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }
    } catch (err) {
      logger.error({ err }, 'Failed to connect to Redis initially');
    }
  })();
} else {
  // If no Redis URL is provided, provide a "dummy" client that mimics the interface
  // but always returns false for isOpen. This triggers graceful fallbacks in services.
  redisClient = {
    isOpen: false,
    on: () => {},
    get: async () => null,
    setEx: async () => {},
    incr: async () => {},
    connect: async () => {
      logger.warn('Redis connection attempted but REDIS_URL is missing. Skipping.');
    },
  };
  logger.info('REDIS_URL not set. Running without Redis cache.');
}

export { redisClient };
