/**
 * Authentication & Authorization Service
 * 
 * Provides robust authentication and authorization features including:
 * - User registration with secure password hashing
 * - Login with JWT tokens and refresh tokens
 * - Role-based access control (RBAC)
 * - Two-factor authentication support
 * - Password reset functionality
 * - Session management
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { auth_users, auth_sessions, auth_2fa, auth_password_resets } from "@shared/schema";
import { storage } from "./storage";
import { randomBytes } from "crypto";

// Configuration constants
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key-for-development";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-jwt-refresh-secret-key";
const JWT_EXPIRES_IN = "1h";
const JWT_REFRESH_EXPIRES_IN = "7d";
const BCRYPT_SALT_ROUNDS = 12;

// Types
interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Hashes a password using bcrypt algorithm
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Compares a supplied password against a stored hashed password
 * @param supplied - The plain text password to verify
 * @param stored - The stored hashed password
 * @returns Boolean indicating if passwords match
 */
export async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

/**
 * Generates a JWT token for authenticated user
 * @param user - User object with authentication data
 * @returns JWT token string
 */
export function generateJwtToken(user: { id: number, username: string, email: string, role: string }): string {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Generates a refresh token
 * @param userId - ID of the user
 * @returns Refresh token string
 */
export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
}

/**
 * Validates a JWT token
 * @param token - JWT token to validate
 * @returns Decoded token payload or null if invalid
 */
export function validateJwtToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Validates a refresh token
 * @param token - Refresh token to validate
 * @returns User ID or null if invalid
 */
export function validateRefreshToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Generates a password reset token
 * @returns Random token string
 */
export function generatePasswordResetToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Sets up the authentication system in the Express application
 * @param app - Express application instance
 */
export function setupAuth(app: Express) {
  // Configure LocalStrategy for username/password authentication
  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // Check if user is active
          if (!user.isActive) {
            return done(null, false, { message: "Account is inactive" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Session serialization/deserialization
  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as any).id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  /**
   * API Endpoint: Register a new user
   * 
   * POST /auth/register
   * Request body: { email, mobile_number, password, role }
   * Response: 201 Created - User created successfully
   */
  app.post("/auth/register", async (req, res) => {
    try {
      const { email, mobile_number, password, role = "user" } = req.body;
      
      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          message: "Missing required fields",
          errors: {
            email: !email ? "Email is required" : null,
            password: !password ? "Password is required" : null,
          }
        });
      }
      
      // Check for existing user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Log failed registration attempt due to existing email
        await storage.createAuditLog({
          user_id: null,
          event_type: 'USER_REGISTRATION_ATTEMPT',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { email, reason: 'EMAIL_EXISTS' },
          resource_type: 'user',
          resource_id: null,
          status: 'FAILED'
        });
        
        return res.status(409).json({ message: "Email already exists" });
      }
      
      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: "Password is too weak",
          requirements: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters"
        });
      }
      
      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      const newUser = await storage.createUser({
        username: email.split('@')[0], // Use email prefix as username
        email,
        mobile_number,
        password: hashedPassword,
        role,
      });
      
      // Create JWT token
      const token = generateJwtToken({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      });
      
      const refreshToken = generateRefreshToken(newUser.id);
      
      // Store session
      await storage.createSession({
        user_id: newUser.id,
        session_id: randomBytes(16).toString('hex'),
        jwt_token: token,
        refresh_token: refreshToken,
        ip_address: req.ip,
        device_info: req.headers['user-agent'] || '',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      // Log successful registration
      await storage.createAuditLog({
        user_id: newUser.id,
        event_type: 'USER_REGISTRATION',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          username: newUser.username, 
          email: newUser.email, 
          role: newUser.role 
        },
        resource_type: 'user',
        resource_id: newUser.id.toString(),
        status: 'SUCCESS'
      });
      
      // Return user data and tokens
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
        token,
        refreshToken,
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Log registration error
      await storage.createAuditLog({
        user_id: null,
        event_type: 'USER_REGISTRATION_ERROR',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { error: error.message || 'Unknown error' },
        resource_type: 'user',
        resource_id: null,
        status: 'ERROR'
      });
      
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  /**
   * API Endpoint: Login user
   * 
   * POST /auth/login
   * Request body: { email, password }
   * Response: 200 OK - Login successful with tokens
   */
  app.post("/auth/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        // Log failed login attempt
        await storage.createAuditLog({
          user_id: null,
          event_type: 'LOGIN_FAILED',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { 
            reason: info?.message || "Invalid credentials",
            email: req.body.email 
          },
          resource_type: 'user',
          resource_id: null,
          status: 'FAILED'
        });
        
        return res.status(401).json({ 
          message: info?.message || "Invalid credentials" 
        });
      }
      
      try {
        // Generate tokens
        const token = generateJwtToken({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        });
        
        const refreshToken = generateRefreshToken(user.id);
        
        // Store session
        await storage.createSession({
          user_id: user.id,
          session_id: randomBytes(16).toString('hex'),
          jwt_token: token,
          refresh_token: refreshToken,
          ip_address: req.ip,
          device_info: req.headers['user-agent'] || '',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
        
        // Update last login time
        await storage.updateUserLastLogin(user.id);
        
        // Log successful login
        await storage.createAuditLog({
          user_id: user.id,
          event_type: 'LOGIN_SUCCESS',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { 
            username: user.username, 
            email: user.email,
            role: user.role
          },
          resource_type: 'user',
          resource_id: user.id.toString(),
          status: 'SUCCESS'
        });
        
        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
          },
          token,
          refreshToken,
        });
      } catch (error: any) {
        console.error("Login error:", error);
        
        // Log login error
        await storage.createAuditLog({
          user_id: user.id,
          event_type: 'LOGIN_ERROR',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { 
            error: error.message || 'Unknown error',
            username: user.username 
          },
          resource_type: 'user',
          resource_id: user.id.toString(),
          status: 'ERROR'
        });
        
        res.status(500).json({ message: "Failed to log in" });
      }
    })(req, res, next);
  });

  /**
   * API Endpoint: Refresh JWT token
   * 
   * POST /auth/refresh
   * Request body: { refreshToken }
   * Response: 200 OK - New token issued
   */
  app.post("/auth/refresh", async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }
    
    try {
      // Validate refresh token
      const userId = validateRefreshToken(refreshToken);
      if (!userId) {
        // Log failed token refresh
        await storage.createAuditLog({
          user_id: null,
          event_type: 'TOKEN_REFRESH_FAILED',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { reason: "Invalid refresh token signature" },
          resource_type: 'session',
          resource_id: null,
          status: 'FAILED'
        });
        
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      
      // Check if the refresh token exists in the database
      const session = await storage.getSessionByRefreshToken(refreshToken);
      if (!session) {
        // Log failed token refresh - token not found in database
        await storage.createAuditLog({
          user_id: userId,
          event_type: 'TOKEN_REFRESH_FAILED',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { reason: "Refresh token not found in database" },
          resource_type: 'session',
          resource_id: null,
          status: 'FAILED'
        });
        
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      
      // Get user data
      const user = await storage.getUser(userId);
      if (!user || !user.isActive) {
        // Log failed token refresh - user not found or inactive
        await storage.createAuditLog({
          user_id: userId,
          event_type: 'TOKEN_REFRESH_FAILED',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { 
            reason: !user ? "User not found" : "User account inactive"
          },
          resource_type: 'user',
          resource_id: userId.toString(),
          status: 'FAILED'
        });
        
        return res.status(401).json({ message: "User not found or inactive" });
      }
      
      // Generate new tokens
      const newToken = generateJwtToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
      
      const newRefreshToken = generateRefreshToken(user.id);
      
      // Update session with new tokens
      await storage.updateSession(session.id, {
        jwt_token: newToken,
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
      
      // Log token refresh
      await storage.createAuditLog({
        user_id: user.id,
        event_type: 'TOKEN_REFRESH',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          username: user.username,
          email: user.email
        },
        resource_type: 'session',
        resource_id: session.id.toString(),
        status: 'SUCCESS'
      });
      
      res.json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error: any) {
      console.error("Refresh token error:", error);
      
      // Log token refresh error
      try {
        // Try to extract user ID from the token if possible
        let userId = null;
        try {
          userId = validateRefreshToken(refreshToken);
        } catch (e) {
          // Ignore error, just means we can't identify the user
        }
        
        await storage.createAuditLog({
          user_id: userId,
          event_type: 'TOKEN_REFRESH_ERROR',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || null,
          event_details: { error: error.message || 'Unknown error' },
          resource_type: 'session',
          resource_id: null,
          status: 'ERROR'
        });
      } catch (logError) {
        console.error("Failed to log token refresh error:", logError);
      }
      
      res.status(500).json({ message: "Failed to refresh token" });
    }
  });

  /**
   * API Endpoint: Logout user
   * 
   * POST /auth/logout
   * Headers: Authorization: Bearer {token}
   * Response: 200 OK - Logged out successfully
   */
  app.post("/auth/logout", async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    
    try {
      // Get user ID from the token
      const payload = validateJwtToken(token);
      if (!payload) {
        return res.status(401).json({ message: "Invalid token" });
      }
      
      // Remove session
      await storage.deleteSessionByToken(token);
      
      // Log successful logout
      await storage.createAuditLog({
        user_id: payload.userId,
        event_type: 'LOGOUT',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          username: payload.username
        },
        resource_type: 'session',
        resource_id: null,
        status: 'SUCCESS'
      });
      
      res.json({ message: "Logged out successfully" });
    } catch (error: any) {
      console.error("Logout error:", error);
      
      // Log logout error (best effort - might not have user ID)
      try {
        const payload = validateJwtToken(token);
        if (payload) {
          await storage.createAuditLog({
            user_id: payload.userId,
            event_type: 'LOGOUT_ERROR',
            ip_address: req.ip,
            user_agent: req.headers['user-agent'] || null,
            event_details: { error: error.message || 'Unknown error' },
            resource_type: 'session',
            resource_id: null,
            status: 'ERROR'
          });
        }
      } catch (logError) {
        console.error("Failed to log logout error:", logError);
      }
      
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  /**
   * API Endpoint: Setup 2FA
   * 
   * POST /auth/2fa/setup
   * Headers: Authorization: Bearer {token}
   * Response: 200 OK - 2FA setup successful
   */
  app.post("/auth/2fa/setup", jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      
      // Generate TOTP secret (in a real implementation, you'd use a TOTP library like speakeasy)
      const totpSecret = randomBytes(20).toString('hex');
      
      // Save to database (setup but not enabled yet)
      const twoFactorAuth = await storage.setupTwoFactorAuth(userId, totpSecret);
      
      // Log 2FA setup
      await storage.createAuditLog({
        user_id: userId,
        event_type: '2FA_SETUP',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          is_enabled: false
        },
        resource_type: 'user',
        resource_id: userId.toString(),
        status: 'SUCCESS'
      });
      
      res.json({
        message: "2FA setup initiated",
        secret: totpSecret,
        isEnabled: false,
        // In production, you would also return a QR code URL using a library like qrcode:
        // qrUrl: await QRCode.toDataURL(`otpauth://totp/AppName:${user.email}?secret=${totpSecret}&issuer=AppName`)
      });
    } catch (error) {
      console.error("2FA setup error:", error);
      res.status(500).json({ message: "Failed to setup 2FA" });
    }
  });
  
  /**
   * API Endpoint: Verify and Enable 2FA
   * 
   * POST /auth/2fa/verify
   * Headers: Authorization: Bearer {token}
   * Request body: { code }
   * Response: 200 OK - 2FA verified and enabled
   */
  app.post("/auth/2fa/verify", jwtAuthMiddleware, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = (req as any).userId;
      
      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      
      // Get the user's 2FA settings
      const twoFactorAuth = await storage.getTwoFactorAuth(userId);
      if (!twoFactorAuth || !twoFactorAuth.totp_secret) {
        return res.status(400).json({ message: "2FA not set up for this user" });
      }
      
      // In a real implementation, you would verify the TOTP code using a library like speakeasy:
      // const verified = speakeasy.totp.verify({
      //   secret: twoFactorAuth.totp_secret,
      //   encoding: 'hex',
      //   token: code,
      //   window: 1 // Allow 1 time step before/after for clock drift
      // });
      
      // For the example, we're just checking if the code is "123456" (simulating verification)
      const verified = code === "123456";
      
      if (!verified) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Enable 2FA for the user
      await storage.updateTwoFactorAuth(userId, { is_enabled: true });
      
      // Log 2FA verification & enabling
      await storage.createAuditLog({
        user_id: userId,
        event_type: '2FA_ENABLED',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: {},
        resource_type: 'user',
        resource_id: userId.toString(),
        status: 'SUCCESS'
      });
      
      res.json({
        message: "2FA successfully enabled",
        isEnabled: true
      });
    } catch (error) {
      console.error("2FA verification error:", error);
      res.status(500).json({ message: "Failed to verify 2FA code" });
    }
  });
  
  /**
   * API Endpoint: Disable 2FA
   * 
   * POST /auth/2fa/disable
   * Headers: Authorization: Bearer {token}
   * Request body: { code }
   * Response: 200 OK - 2FA disabled
   */
  app.post("/auth/2fa/disable", jwtAuthMiddleware, async (req, res) => {
    try {
      const { code } = req.body;
      const userId = (req as any).userId;
      
      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      
      // Get the user's 2FA settings
      const twoFactorAuth = await storage.getTwoFactorAuth(userId);
      if (!twoFactorAuth || !twoFactorAuth.is_enabled) {
        return res.status(400).json({ message: "2FA not enabled for this user" });
      }
      
      // Verify the code (same simulation as above)
      const verified = code === "123456";
      
      if (!verified) {
        return res.status(400).json({ message: "Invalid verification code" });
      }
      
      // Disable 2FA for the user
      await storage.updateTwoFactorAuth(userId, { 
        is_enabled: false,
        totp_secret: null // Optionally clear the secret
      });
      
      // Log 2FA disabling
      await storage.createAuditLog({
        user_id: userId,
        event_type: '2FA_DISABLED',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: {},
        resource_type: 'user',
        resource_id: userId.toString(),
        status: 'SUCCESS'
      });
      
      res.json({
        message: "2FA successfully disabled",
        isEnabled: false
      });
    } catch (error) {
      console.error("2FA disable error:", error);
      res.status(500).json({ message: "Failed to disable 2FA" });
    }
  });

  /**
   * API Endpoint: Request password reset
   * 
   * POST /auth/password-reset/request
   * Request body: { email }
   * Response: 200 OK - Reset email sent
   */
  app.post("/auth/password-reset/request", async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    try {
      const user = await storage.getUserByEmail(email);
      
      // Always return success even if user not found (security best practice)
      if (!user) {
        return res.json({ message: "If the email exists, a reset link has been sent" });
      }
      
      // Generate reset token
      const token = generatePasswordResetToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      
      // Save token to database
      await storage.createPasswordReset({
        user_id: user.id,
        token,
        expires_at: expiresAt,
      });
      
      // Log password reset request
      await storage.createAuditLog({
        user_id: user.id,
        event_type: 'PASSWORD_RESET_REQUESTED',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          email: user.email,
          expires_at: expiresAt.toISOString()
        },
        resource_type: 'user',
        resource_id: user.id.toString(),
        status: 'SUCCESS'
      });
      
      // In production, you would send an email with the reset link
      // For now, we just return the token for testing
      res.json({
        message: "Password reset email sent",
        // Only for development/testing:
        resetToken: token,
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process reset request" });
    }
  });
  
  /**
   * API Endpoint: Reset password
   * 
   * POST /auth/password-reset/confirm
   * Request body: { token, password }
   * Response: 200 OK - Password reset successful
   */
  app.post("/auth/password-reset/confirm", async (req, res) => {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ 
        message: "Missing required fields",
        errors: {
          token: !token ? "Token is required" : null,
          password: !password ? "New password is required" : null,
        }
      });
    }
    
    try {
      // Validate password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message: "Password is too weak",
          requirements: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters"
        });
      }
      
      // Find the reset token record
      const resetRecord = await storage.getPasswordResetByToken(token);
      if (!resetRecord) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      // Check if token is expired
      if (new Date() > resetRecord.expires_at) {
        return res.status(400).json({ message: "Token has expired" });
      }
      
      // Check if token has already been used
      if (resetRecord.used_at) {
        return res.status(400).json({ message: "Token has already been used" });
      }
      
      // Get the user
      const user = await storage.getUser(resetRecord.user_id);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update user's password
      await storage.updateUser(user.id, { password: hashedPassword });
      
      // Mark the reset token as used
      await storage.markPasswordResetUsed(token);
      
      // Log out other sessions (recommended for security)
      await storage.invalidateAllUserSessions(user.id);
      
      // Log successful password reset
      await storage.createAuditLog({
        user_id: user.id,
        event_type: 'PASSWORD_RESET_COMPLETED',
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || null,
        event_details: { 
          email: user.email,
          sessions_invalidated: true
        },
        resource_type: 'user',
        resource_id: user.id.toString(),
        status: 'SUCCESS'
      });
      
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset confirm error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
}

/**
 * JWT Authentication middleware
 * Validates JWT token from Authorization header
 */
export function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    console.log('JWT Auth: No token provided');
    return res.status(401).json({ message: "No token provided" });
  }
  
  console.log(`JWT Auth: Validating token: ${token.substring(0, 20)}...`);
  
  const payload = validateJwtToken(token);
  if (!payload) {
    console.log('JWT Auth: Invalid or expired token');
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  
  // Set user data in request object
  (req as any).userId = payload.userId;
  (req as any).user = {
    id: payload.userId,
    username: payload.username,
    email: payload.email,
    role: payload.role,
  };
  
  console.log(`JWT Auth: Token valid for user: ${payload.username} (${payload.userId})`);
  next();
}

/**
 * Role-based authorization middleware
 * @param roles - Array of allowed roles
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    // First ensure the user is authenticated with JWT
    jwtAuthMiddleware(req, res, (err) => {
      if (err) return next(err);
      
      const user = (req as any).user;
      
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      
      next();
    });
  };
}