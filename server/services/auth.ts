import { db } from '../db';
import { auth_users, auth_sessions, auth_2fa, auth_password_resets } from '../schema/auth';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config } from '../config';
import { 
  User, 
  Session, 
  DeviceInfo, 
  RegisterInput, 
  LoginInput, 
  TokenPayload, 
  NewUser, 
  NewSession,
  AuthError,
  AuthErrorCode,
  UserRole,
  UUID,
  isUUID
} from '../types/auth';

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  mobile_number: z.string().optional(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.nativeEnum(UserRole).default(UserRole.USER),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Helper function to convert database model to application type
const toUser = (dbUser: any): User | null => {
  if (!dbUser || !isUUID(dbUser.id)) return null;
  
  return {
    id: dbUser.id,
    email: dbUser.email,
    mobile_number: dbUser.mobile_number,
    password_hash: dbUser.password_hash,
    role: dbUser.role as UserRole,
    is_active: dbUser.is_active,
    failed_login_attempts: dbUser.failed_login_attempts,
    last_failed_login_at: dbUser.last_failed_login_at,
    last_login_at: dbUser.last_login_at,
    created_at: dbUser.created_at,
    updated_at: dbUser.updated_at,
    deleted_at: dbUser.deleted_at,
  };
};

// Helper function to convert database model to session type
const toSession = (dbSession: any): Session | null => {
  if (!dbSession || !isUUID(dbSession.id)) return null;
  
  return {
    id: dbSession.id,
    user_id: dbSession.user_id,
    token: dbSession.token,
    refresh_token: dbSession.refresh_token,
    device_info: dbSession.device_info,
    ip_address: dbSession.ip_address,
    user_agent: dbSession.user_agent,
    expires_at: dbSession.expires_at,
    created_at: dbSession.created_at,
    updated_at: dbSession.updated_at,
  };
};

export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  // Register a new user
  async register(input: RegisterInput): Promise<User> {
    // Validate input
    const validatedInput = registerSchema.parse(input);

    // Check if user already exists
    const existingUser = await db.query.auth_users.findFirst({
      where: eq(auth_users.email, validatedInput.email),
    });

    if (existingUser) {
      throw new AuthError('User already exists', AuthErrorCode.USER_EXISTS);
    }

    // Hash password
    const password_hash = await bcrypt.hash(validatedInput.password, 12);

    // Create user
    const [dbUser] = await db.insert(auth_users).values({
      email: validatedInput.email,
      mobile_number: validatedInput.mobile_number || null,
      password_hash,
      role: validatedInput.role,
      is_active: true,
      failed_login_attempts: 0,
      last_failed_login_at: null,
      last_login_at: null,
    }).returning();

    const user = toUser(dbUser);
    if (!user) {
      throw new AuthError('Failed to create user', AuthErrorCode.INVALID_CREDENTIALS);
    }

    return user;
  }

  // Login user
  async login(input: LoginInput, deviceInfo?: DeviceInfo): Promise<{ user: User; session: Session }> {
    // Validate input
    const validatedInput = loginSchema.parse(input);

    // Find user
    const dbUser = await db.query.auth_users.findFirst({
      where: eq(auth_users.email, validatedInput.email),
    });

    const user = toUser(dbUser);
    if (!user) {
      throw new AuthError('Invalid credentials', AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Check if account is locked
    if (user.failed_login_attempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = user.last_failed_login_at?.getTime() || 0;
      const timeSinceLastAttempt = Date.now() - lockoutTime;
      
      if (timeSinceLastAttempt < this.LOCKOUT_DURATION) {
        const remainingTime = Math.ceil((this.LOCKOUT_DURATION - timeSinceLastAttempt) / 1000 / 60);
        throw new AuthError(
          `Account locked. Try again in ${remainingTime} minutes`,
          AuthErrorCode.ACCOUNT_LOCKED
        );
      }
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AuthError('Account is inactive', AuthErrorCode.ACCOUNT_INACTIVE);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedInput.password, user.password_hash);
    if (!isValidPassword) {
      // Update failed login attempts
      await db.update(auth_users)
        .set({
          failed_login_attempts: (user.failed_login_attempts || 0) + 1,
          last_failed_login_at: new Date(),
        })
        .where(eq(auth_users.id, user.id));
      throw new AuthError('Invalid credentials', AuthErrorCode.INVALID_CREDENTIALS);
    }

    // Reset failed login attempts on successful login
    await db.update(auth_users)
      .set({
        failed_login_attempts: 0,
        last_login_at: new Date(),
      })
      .where(eq(auth_users.id, user.id));

    // Generate tokens
    const sessionId = uuidv4() as UUID;
    const token = jwt.sign(
      { 
        userId: user.id, 
        sessionId,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
      },
      config.jwt.secret
    );
    const refreshToken = jwt.sign(
      { 
        userId: user.id, 
        sessionId,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      },
      config.jwt.refreshSecret
    );

    // Create session
    const [dbSession] = await db.insert(auth_sessions).values({
      user_id: user.id,
      token,
      refresh_token: refreshToken,
      device_info: deviceInfo,
      ip_address: deviceInfo?.ip_address || null,
      user_agent: deviceInfo?.user_agent || null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }).returning();

    const session = toSession(dbSession);
    if (!session) {
      throw new AuthError('Failed to create session', AuthErrorCode.INVALID_CREDENTIALS);
    }

    return { user, session };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<Session> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;
      
      if (!isUUID(decoded.userId) || !isUUID(decoded.sessionId)) {
        throw new AuthError('Invalid token payload', AuthErrorCode.INVALID_TOKEN);
      }

      // Find session
      const dbSession = await db.query.auth_sessions.findFirst({
        where: eq(auth_sessions.refresh_token, refreshToken),
      });

      const session = toSession(dbSession);
      if (!session) {
        throw new AuthError('Invalid refresh token', AuthErrorCode.INVALID_REFRESH_TOKEN);
      }

      // Generate new tokens
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          sessionId: decoded.sessionId,
          role: decoded.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        },
        config.jwt.secret
      );
      const newRefreshToken = jwt.sign(
        { 
          userId: decoded.userId, 
          sessionId: decoded.sessionId,
          role: decoded.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
        },
        config.jwt.refreshSecret
      );

      // Update session
      const [updatedDbSession] = await db.update(auth_sessions)
        .set({
          token: newToken,
          refresh_token: newRefreshToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .where(eq(auth_sessions.id, session.id))
        .returning();

      const updatedSession = toSession(updatedDbSession);
      if (!updatedSession) {
        throw new AuthError('Failed to update session', AuthErrorCode.INVALID_TOKEN);
      }

      return updatedSession;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Invalid refresh token', AuthErrorCode.INVALID_REFRESH_TOKEN);
    }
  }

  // Logout
  async logout(sessionId: UUID): Promise<void> {
    await db.delete(auth_sessions)
      .where(eq(auth_sessions.id, sessionId));
  }

  // Get user by ID
  async getUserById(userId: UUID): Promise<User | null> {
    const dbUser = await db.query.auth_users.findFirst({
      where: eq(auth_users.id, userId),
    });
    return toUser(dbUser);
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const dbUser = await db.query.auth_users.findFirst({
      where: eq(auth_users.email, email),
    });
    return toUser(dbUser);
  }
}

export const authService = new AuthService(); 