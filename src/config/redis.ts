import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => {
  logger.info('🚀 Redis connection initiated');
});

redis.on('ready', () => {
  logger.info('🚀 Redis connection established and ready');
});

redis.on('error', (err: Error) => {
  logger.error(err, '❌ Redis connection error');
});

redis.on('reconnecting', (delay?: number) => {
  logger.warn(`🔄 Redis reconnecting in ${delay ?? 0}ms...`);
});

export const connectRedis = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve();
      return;
    }

    const onReady = () => {
      redis.off('error', onError);
      resolve();
    };

    const onError = (err: Error) => {
      redis.off('ready', onReady);
      reject(err);
    };

    redis.once('ready', onReady);
    redis.once('error', onError);
  });
};

