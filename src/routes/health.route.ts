import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Get API server and services health status
 *     description: Returns the status of the server, PostgreSQL database, Redis connection, and system uptime.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is running and services status are returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Server Running
 *                 database:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                   example: connected
 *                 redis:
 *                   type: string
 *                   enum: [connected, disconnected]
 *                   example: connected
 *                 uptime:
 *                   type: string
 *                   example: 0h 5m 12s
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2026-07-29T15:58:30.123Z"
 */
router.get('/', getHealth);

export default router;
