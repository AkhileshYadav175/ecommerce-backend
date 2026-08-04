import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecommerce Backend API',
      version: '1.0.0',
      description: 'Production-ready Node.js + Express + TypeScript ecommerce backend API documentation.',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development Server',
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/modules/**/*.ts',
    './src/routes/*.js',
    './src/modules/**/*.js',
    './dist/routes/*.js',
    './dist/modules/**/*.js'
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
