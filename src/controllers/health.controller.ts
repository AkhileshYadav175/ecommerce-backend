import { Request, Response, NextFunction } from 'express';
import { db } from '../config/database.js';
import { redis } from '../config/redis.js';

export const getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let databaseStatus = 'disconnected';
  let redisStatus = 'disconnected';

  try {
    // Check PostgreSQL connection
    await db.query('SELECT 1');
    databaseStatus = 'connected';
  } catch (error) {
    databaseStatus = 'disconnected';
  }

  try {
    // Check Redis connection status
    if (redis.status === 'ready') {
      redisStatus = 'connected';
    }
  } catch (error) {
    redisStatus = 'disconnected';
  }

  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

  res.status(200).json({
    success: true,
    message: 'Server Running',
    database: databaseStatus,
    redis: redisStatus,
    uptime: uptimeFormatted,
    timestamp: new Date().toISOString(),
  });
};
