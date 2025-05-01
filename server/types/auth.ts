import { InferModel } from 'drizzle-orm';
import { auth_users, auth_sessions, auth_2fa, auth_password_resets } from '../schema/auth';

// Custom UUID type for type safety
export type UUID = string & { readonly _brand: unique symbol };
export const isUUID = (value: string): value is UUID => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// User roles as const enum
export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
  SUPPORT: 'support',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

// Database model types
export type DBUser = InferModel<typeof auth_users>;
export type DBSession = InferModel<typeof auth_sessions>;
export type DBTwoFactorAuth = InferModel<typeof auth_2fa>;
export type DBPasswordReset = InferModel<typeof auth_password_resets>;

// Application types extending database models
export interface User extends DBUser {
  id: UUID;
  role: UserRole;
}

export interface Session extends DBSession {
  id: UUID;
  user_id: UUID;
}

export interface TwoFactorAuth extends DBTwoFactorAuth {
  id: UUID;
  user_id: UUID;
}

export interface PasswordReset extends DBPasswordReset {
  id: UUID;
  user_id: UUID;
}

// New entity types
export interface NewUser {
  email: string;
  mobile_number: string | null;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
}

export interface NewSession {
  user_id: UUID;
  token: string;
  refresh_token: string;
  device_info?: DeviceInfo;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: Date;
}

export interface NewTwoFactorAuth {
  user_id: UUID;
  secret: string;
  backup_codes: string[];
  is_enabled: boolean;
}

export interface NewPasswordReset {
  user_id: UUID;
  token: string;
  expires_at: Date;
}

// Input types
export interface DeviceInfo {
  ip_address?: string;
  user_agent?: string;
  [key: string]: any;
}

export interface RegisterInput {
  email: string;
  mobile_number?: string;
  password: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

// JWT types
export interface TokenPayload {
  userId: UUID;
  sessionId: UUID;
  role: UserRole;
  iat: number;
  exp: number;
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const AuthErrorCode = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  USER_EXISTS: 'USER_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  INVALID_2FA_CODE: 'INVALID_2FA_CODE',
  PASSWORD_RESET_EXPIRED: 'PASSWORD_RESET_EXPIRED',
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode]; 