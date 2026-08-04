import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { pinoHttp } from 'pino-http';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import healthRouter from './routes/health.route.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
import authRouter from './modules/auth/auth.routes.js';
import userRouter from './modules/user/route/user.routes.js';
import categoryRouter from './modules/category/route/category.routes.js';

const app = express();

// Security and compression middlewares
// Bypassing helmet for Swagger UI docs route to prevent content security policy (CSP) block on styles/scripts
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api-docs') || req.path.startsWith('/docs')) {
    next();
  } else {
    helmet()(req, res, next);
  }
});

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logger middleware
app.use(
  pinoHttp({
    logger,
    autoLogging: env.NODE_ENV !== 'test',
  })
);

// Register Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Register routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/categories', categoryRouter);

// 404 Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Custom Error Interface
interface AppError extends Error {
  status?: number;
}

// Global Error Middleware
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(err, `Error occurred during request ${req.method} ${req.url}`);

  res.status(status).json({
    success: false,
    error: {
      message,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
});

export default app;
