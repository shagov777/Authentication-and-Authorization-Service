import { z } from 'zod';

// Error Codes
export const ErrorCode = {
  // Authentication Errors
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_2FA_CODE: 'INVALID_2FA_CODE',
  PASSWORD_RESET_EXPIRED: 'PASSWORD_RESET_EXPIRED',

  // Authorization Errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_REQUIRED: 'ROLE_REQUIRED',
  SCOPE_REQUIRED: 'SCOPE_REQUIRED',

  // Validation Errors
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // System Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];

// Error Schema
export const errorSchema = z.object({
  code: z.enum(Object.values(ErrorCode) as [string, ...string[]]),
  message: z.string(),
  statusCode: z.number().int().min(400).max(599),
  details: z.record(z.unknown()).optional(),
  path: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

export type ErrorResponse = z.infer<typeof errorSchema>;

// Base Error Class
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
    public path?: string
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      path: this.path,
      timestamp: new Date().toISOString(),
    };
  }
}

// Authentication Errors
export class AuthenticationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message, code, 401, details);
    this.name = 'AuthenticationError';
  }
}

// Authorization Errors
export class AuthorizationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message, code, 403, details);
    this.name = 'AuthorizationError';
  }
}

// Validation Errors
export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message, code, 400, details);
    this.name = 'ValidationError';
  }
}

// System Errors
export class SystemError extends AppError {
  constructor(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>
  ) {
    super(message, code, 500, details);
    this.name = 'SystemError';
  }
}

// Type Guard Functions
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError;
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isSystemError(error: unknown): error is SystemError {
  return error instanceof SystemError;
} 