/**
 * Authentication module for the database schema manager application.
 * 
 * This module provides standard authentication using passport.js with LocalStrategy.
 * The implementation includes:
 * - User registration with secure password hashing
 * - Login with username/password validation
 * - Session management using express-session
 * - Logout functionality
 * - Route protection middleware
 * 
 * Available API endpoints:
 * - POST /api/register - Register a new user
 * - POST /api/login - Log in an existing user
 * - POST /api/logout - Log out the current user
 * - GET /api/user - Get current authenticated user
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

/**
 * Hashes a password using scrypt algorithm with salt
 * @param password - Plain text password to hash
 * @returns A string in the format 'hashedPassword.salt'
 */
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Compares a supplied password against a stored hashed password
 * @param supplied - The plain text password to verify
 * @param stored - The stored hashed password with salt
 * @returns Boolean indicating if passwords match
 */
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

/**
 * Sets up the authentication system in the Express application
 * @param app - Express application instance
 */
export function setupAuth(app: Express) {
  // Configure session settings
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'secret-key-for-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  // Initialize session and passport middleware
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure LocalStrategy for username/password authentication
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password || ''))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    })
  );

  // Configure session serialization/deserialization
  passport.serializeUser((user: Express.User, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  /**
   * API Endpoint: Register a new user
   * 
   * POST /api/register
   * Request body: { username, email, password, roleId }
   * Response: 201 Created - { id, username } or error
   */
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  /**
   * API Endpoint: Login an existing user
   * 
   * POST /api/login
   * Request body: { username, password }
   * Response: 200 OK - { id, username } or 401 Unauthorized
   */
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid username or password" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json({ id: user.id, username: user.username });
      });
    })(req, res, next);
  });

  /**
   * API Endpoint: Logout the current user
   * 
   * POST /api/logout
   * Request body: None
   * Response: 200 OK - { message: "Logged out successfully" }
   */
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  /**
   * API Endpoint: Get current authenticated user
   * 
   * GET /api/user
   * Response: 200 OK - { id, username } or 401 Unauthorized
   */
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user as User;
    res.json({ id: user.id, username: user.username });
  });
}

/**
 * Middleware to check if a user is authenticated
 * Can be applied to any route to protect it
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}