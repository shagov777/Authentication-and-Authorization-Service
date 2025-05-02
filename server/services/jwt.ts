import jwt, { SignOptions } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { JWTValidationResult, jwtPayloadSchema } from '../types/jwt';
import { config } from '../config';
import { AuthenticationError, ErrorCode } from '../types/errors';

export class JWTService {
  private static readonly JWT_SECRET = config.jwt.secret;
  private static readonly JWT_REFRESH_SECRET = config.jwt.refreshSecret;
  private static readonly JWT_EXPIRES_IN = config.jwt.expiresIn as StringValue;
  private static readonly JWT_REFRESH_EXPIRES_IN = config.jwt.refreshExpiresIn as StringValue;

  static generateTokens(userId: string, email: string, role: string, sessionId: string) {
    const payload = {
      sub: userId,
      email,
      role,
      sessionId,
    };

    const accessTokenOptions: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN,
    };

    const refreshTokenOptions: SignOptions = {
      expiresIn: this.JWT_REFRESH_EXPIRES_IN,
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, accessTokenOptions);
    const refreshToken = jwt.sign({ sub: userId }, this.JWT_REFRESH_SECRET, refreshTokenOptions);

    return { accessToken, refreshToken };
  }

  static validateAccessToken(token: string): JWTValidationResult {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET);
      const validated = jwtPayloadSchema.safeParse(decoded);

      if (!validated.success) {
        return {
          valid: false,
          error: new AuthenticationError(
            'Invalid token payload',
            ErrorCode.INVALID_TOKEN,
            { validationErrors: validated.error.errors }
          ),
        };
      }

      return { valid: true, payload: validated.data };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: new AuthenticationError(
            'Token has expired',
            ErrorCode.SESSION_EXPIRED,
            { expiredAt: error.expiredAt }
          ),
        };
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: new AuthenticationError(
            'Invalid token signature',
            ErrorCode.INVALID_TOKEN,
            { error: error.message }
          ),
        };
      }

      return {
        valid: false,
        error: new AuthenticationError(
          'Invalid token',
          ErrorCode.INVALID_TOKEN,
          { error: error instanceof Error ? error.message : 'Unknown error' }
        ),
      };
    }
  }

  static validateRefreshToken(token: string): { userId: string } | AuthenticationError {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as { sub: string };
      return { userId: decoded.sub };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return new AuthenticationError(
          'Refresh token has expired',
          ErrorCode.SESSION_EXPIRED,
          { expiredAt: error.expiredAt }
        );
      }

      return new AuthenticationError(
        'Invalid refresh token',
        ErrorCode.INVALID_REFRESH_TOKEN,
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
} 