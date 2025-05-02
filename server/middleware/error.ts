import { Request, Response, NextFunction } from 'express';
import { 
  AppError, 
  ErrorResponse, 
  isAppError, 
  isAuthenticationError, 
  isAuthorizationError, 
  isValidationError, 
  isSystemError,
  ErrorCode
} from '../types/errors';
import { errorSchema } from '../types/errors';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Default error response
  const defaultError: ErrorResponse = {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    statusCode: 500,
    path: req.path,
    timestamp: new Date().toISOString(),
  };

  // Handle different types of errors
  if (isAppError(error)) {
    const errorResponse = error.toJSON();
    return res.status(error.statusCode).json(errorResponse);
  }

  if (isAuthenticationError(error)) {
    const errorResponse = error.toJSON();
    return res.status(401).json(errorResponse);
  }

  if (isAuthorizationError(error)) {
    const errorResponse = error.toJSON();
    return res.status(403).json(errorResponse);
  }

  if (isValidationError(error)) {
    const errorResponse = error.toJSON();
    return res.status(400).json(errorResponse);
  }

  if (isSystemError(error)) {
    const errorResponse = error.toJSON();
    return res.status(500).json(errorResponse);
  }

  // Handle Zod validation errors
  if (error instanceof Error && error.name === 'ZodError') {
    const validationError = new AppError(
      'Validation failed',
      ErrorCode.INVALID_INPUT,
      400,
      { errors: JSON.parse(error.message) }
    );
    return res.status(400).json(validationError.toJSON());
  }

  // Handle unknown errors
  console.error('Unhandled error:', error);
  return res.status(500).json(defaultError);
}

// Error logging middleware
export function errorLogger(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errorResponse = isAppError(error) 
    ? error.toJSON() 
    : {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
        path: req.path,
        timestamp: new Date().toISOString(),
      };

  // Log error details
  console.error('Error:', {
    ...errorResponse,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  next(error);
} 