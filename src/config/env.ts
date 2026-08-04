import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid connection URL' }),
  REDIS_URL: z.string().url({ message: 'REDIS_URL must be a valid connection URL' }),
  JWT_SECRET: z.string().min(8, { message: 'JWT_SECRET must be at least 8 characters long' }),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMessage = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`❌ Environment configuration validation failed:\n${errorMessage}`);
}

export const env = parsed.data;
