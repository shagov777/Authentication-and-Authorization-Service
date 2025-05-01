import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const configSchema = z.object({
  port: z.number().default(3000),
  database: z.object({
    url: z.string().url(),
  }),
  jwt: z.object({
    secret: z.string().min(32),
    refreshSecret: z.string().min(32),
    expiresIn: z.string().default('1h'),
    refreshExpiresIn: z.string().default('7d'),
  }),
  cors: z.object({
    origin: z.string().url().or(z.array(z.string().url())),
    credentials: z.boolean().default(true),
  }),
});

const rawConfig = {
  port: parseInt(process.env.PORT || '3000'),
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/auth',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-at-least-32-characters-long',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-at-least-32-characters-long',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: typeof process.env.CORS_ORIGIN === 'string' 
      ? process.env.CORS_ORIGIN.split(',') 
      : ['http://localhost:3000'],
    credentials: true,
  },
};

export const config = configSchema.parse(rawConfig);

// Type for the configuration
export type Config = typeof config; 