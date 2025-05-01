/**
 * API Routes Module
 * 
 * This module defines all the API endpoints for the database schema manager application.
 * It includes routes for:
 * - Authentication and user management
 * - Database schema visualization and management
 * - SQL generation
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { 
  setupAuth as setupEnterpriseAuth, 
  jwtAuthMiddleware, 
  comparePasswords,
  hashPassword
} from "./authentication";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up standard session-based authentication
  setupAuth(app);
  
  // Additionally set up enterprise-grade JWT authentication
  setupEnterpriseAuth(app);
  
  /**
   * User Management API
   */
  
  /**
   * Get current authenticated user
   * GET /api/user
   * Protected: Yes
   * Response: User object (excluding password)
   */
  app.get('/api/user', isAuthenticated, (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = req.user as any;
    // Only send non-sensitive user information
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      isActive: user.isActive
    });
  });
  
  /**
   * Get all users (for test bench and admin use)
   * GET /api/users
   * Protected: Yes
   * Response: Array of user objects (excluding passwords)
   */
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Filter out passwords for security
      const safeUsers = users.map(user => ({
        ...user,
        password: undefined
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  /**
   * Get current authenticated user using JWT authentication
   * GET /auth/user
   * Protected: Yes (JWT)
   * Response: User object (excluding password)
   */
  app.get('/auth/user', jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only return non-sensitive user information
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  /**
   * Get current user's detailed profile
   * GET /auth/profile
   * Protected: Yes (JWT)
   * Response: User profile object with extended information
   */
  app.get('/auth/profile', jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user's 2FA status
      const twoFactorAuth = await storage.getTwoFactorAuth(userId);
      
      // Return profile information including 2FA status
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        mobile_number: user.mobile_number,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        twoFactorEnabled: twoFactorAuth?.is_enabled || false
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });
  
  /**
   * Update current user's profile
   * PUT /auth/profile
   * Protected: Yes (JWT)
   * Request body: { username?, email?, mobile_number? }
   * Response: Updated user profile
   */
  app.put('/auth/profile', jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { username, email, mobile_number } = req.body;
      
      // Validate input
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
        
        // Check if email is already in use by another user
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: "Email is already in use" });
        }
      }
      
      if (username) {
        // Check if username is already in use by another user
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(409).json({ message: "Username is already in use" });
        }
      }
      
      // Update user profile
      const updatedUser = await storage.updateUser(userId, {
        ...(username && { username }),
        ...(email && { email }),
        ...(mobile_number !== undefined && { mobile_number })
      });
      
      // Get user's 2FA status
      const twoFactorAuth = await storage.getTwoFactorAuth(userId);
      
      // Return updated profile
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        mobile_number: updatedUser.mobile_number,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        twoFactorEnabled: twoFactorAuth?.is_enabled || false
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  /**
   * Change user password
   * PUT /auth/change-password
   * Protected: Yes (JWT)
   * Request body: { currentPassword, newPassword }
   * Response: Success message
   */
  app.put('/auth/change-password', jwtAuthMiddleware, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Missing required fields",
          errors: {
            currentPassword: !currentPassword ? "Current password is required" : null,
            newPassword: !newPassword ? "New password is required" : null,
          }
        });
      }
      
      // Get user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate current password
      const isCurrentPasswordValid = await comparePasswords(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Validate new password strength
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
          message: "Password is too weak",
          requirements: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters"
        });
      }
      
      // Hash new password
      const hashedPassword = await hashPassword(newPassword);
      
      // Update user's password
      await storage.updateUser(userId, { 
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      // Invalidate all other sessions for security
      await storage.invalidateAllUserSessions(userId);
      
      // Return success
      res.json({ 
        message: "Password changed successfully",
        note: "For security reasons, you'll need to log in again with your new password"
      });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });
  
  /**
   * Get all available user roles
   * GET /api/roles
   * Protected: No
   * Response: Array of role objects
   */
  app.get('/api/roles', async (req, res) => {
    try {
      const roles = await storage.getAllRoles();
      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });
  
  /**
   * Schema Management API
   */
  
  /**
   * Get full database schema
   * GET /api/schema
   * Protected: No
   * Response: Complete schema object with modules, tables, and relationships
   */
  app.get('/api/schema', async (req, res) => {
    try {
      const schema = await storage.getSchema();
      res.json(schema);
    } catch (error) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ message: "Failed to fetch schema" });
    }
  });
  
  /**
   * Get all modules
   * GET /api/modules
   * Protected: No
   * Response: Array of module objects
   */
  app.get('/api/modules', async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });
  
  /**
   * Get specific module by ID
   * GET /api/modules/:id
   * Protected: No
   * Response: Module object with its tables
   */
  app.get('/api/modules/:id', async (req, res) => {
    try {
      const moduleId = req.params.id;
      const moduleData = await storage.getModuleById(moduleId);
      
      if (!moduleData) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(moduleData);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ message: "Failed to fetch module" });
    }
  });
  
  /**
   * Get specific table by name
   * GET /api/tables/:name
   * Protected: No
   * Response: Table object with columns and indexes
   */
  app.get('/api/tables/:name', async (req, res) => {
    try {
      const tableName = req.params.name;
      const table = await storage.getTableByName(tableName);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(table);
    } catch (error) {
      console.error("Error fetching table:", error);
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });
  
  /**
   * Search schema by query
   * GET /api/search?q=query
   * Protected: No
   * Response: Object with matching tables and columns
   */
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }
      
      const results = await storage.searchSchema(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching schema:", error);
      res.status(500).json({ message: "Failed to search schema" });
    }
  });
  
  /**
   * SQL Generation API
   */
  
  /**
   * Generate SQL for specific module
   * GET /api/sql/module/:id
   * Protected: No
   * Response: Object with SQL string
   */
  app.get('/api/sql/module/:id', async (req, res) => {
    try {
      const moduleId = req.params.id;
      const sql = await storage.generateSqlForModule(moduleId);
      res.json({ sql });
    } catch (error) {
      console.error("Error generating SQL:", error);
      res.status(500).json({ message: "Failed to generate SQL" });
    }
  });
  
  /**
   * Generate SQL for entire schema
   * GET /api/sql/all
   * Protected: No
   * Response: Object with SQL string
   */
  app.get('/api/sql/all', async (req, res) => {
    try {
      const sql = await storage.generateSqlForAllModules();
      res.json({ sql });
    } catch (error) {
      console.error("Error generating SQL:", error);
      res.status(500).json({ message: "Failed to generate SQL" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}