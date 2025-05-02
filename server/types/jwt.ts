import { z } from 'zod';
import { ErrorCode } from './errors';
import { UserRole } from './auth';

// JWT Payload Schema
export const jwtPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  role: z.string(),
  sessionId: z.string().uuid(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

// Type inference from schema
export type JWTPayload = z.infer<typeof jwtPayloadSchema>;

// JWT Error Types
export const JWTErrorCode = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  MISSING_TOKEN: 'MISSING_TOKEN',
  INVALID_PAYLOAD: 'INVALID_PAYLOAD',
} as const;

export type JWTErrorCode = typeof JWTErrorCode[keyof typeof JWTErrorCode];

export class JWTError extends Error {
  constructor(
    message: string,
    public code: JWTErrorCode,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'JWTError';
  }
}

// JWT Validation Result
export interface JWTValidationResult {
  valid: boolean;
  error?: Error;
  payload?: JWTPayload;
} 