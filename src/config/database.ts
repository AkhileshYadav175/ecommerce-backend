import pg from 'pg';
import { env } from './env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const db = new Pool({
  connectionString: env.DATABASE_URL,
});

db.on('error', (err) => {
  logger.error(err, '❌ Unexpected database error on idle client');
});

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = await db.connect();
    logger.info('🐘 Database connected successfully');
    client.release();
  } catch (error) {
    logger.error(error, '❌ Failed to connect to the database');
    throw error;
  }
};
