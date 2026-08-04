import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { db, connectDatabase } from './config/database.js';
import { redis, connectRedis } from './config/redis.js';
import { Server } from 'http';

let server: Server;

const startServer = async (): Promise<void> => {
  try {
    // 1. Connect to PostgreSQL first
    logger.info('Connecting to PostgreSQL database...');
    await connectDatabase();

    // 2. Connect to Redis second
    logger.info('Connecting to Redis...');
    await connectRedis();

    // 3. Start Express server
    const PORT = env.PORT;
    server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} 🚀`);
      console.log('Backend Started 🚀');
    });

  } catch (error) {
    logger.error(error, '❌ Failed to bootstrap application server');
    process.exit(1);
  }
};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);

  if (!server) {
    process.exit(0);
  }

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await db.end();
      logger.info('Database connection pool ended.');
    } catch (err) {
      logger.error(err, 'Error ending database connection pool');
    }

    try {
      await redis.quit();
      logger.info('Redis connection closed.');
    } catch (err) {
      logger.error(err, 'Error closing Redis connection');
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start bootstrapping the server
startServer();
