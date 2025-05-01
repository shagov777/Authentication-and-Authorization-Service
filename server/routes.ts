import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, User } from "@shared/schema";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Middleware to check if user is authenticated
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  // Check for auth token in cookies
  const authToken = req.cookies.authToken;
  
  if (!authToken) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  try {
    // Validate the session
    const user = await storage.validateSession(authToken);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }
    
    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Authentication error" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
  // Authentication routes
  
  // Register new user
  app.post("/api/register", async (req, res) => {
    try {
      // Validate request body
      const validationResult = insertUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      // Create user
      const user = await storage.createUser(req.body);
      
      // Create session
      const token = await storage.createSession(user.id);
      
      // Set cookie
      res.cookie("authToken", token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Login user
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      
      // Validate credentials
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Create session
      const token = await storage.createSession(user.id);
      
      // Set cookie
      res.cookie("authToken", token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  // Logout
  app.post("/api/logout", async (req, res) => {
    try {
      const authToken = req.cookies.authToken;
      
      if (authToken) {
        await storage.deleteSession(authToken);
      }
      
      res.clearCookie("authToken");
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Failed to log out" });
    }
  });
  
  // Get current user
  app.get("/api/user", isAuthenticated, (req, res) => {
    // Remove password from user object
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Schema-related routes
  
  // Get all modules
  app.get("/api/modules", async (_req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve modules" });
    }
  });

  // Get module by ID
  app.get("/api/modules/:id", async (req, res) => {
    try {
      const moduleId = req.params.id;
      const module = await storage.getModuleById(moduleId);
      
      if (!module) {
        return res.status(404).json({ message: "Module not found" });
      }
      
      res.json(module);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve module" });
    }
  });

  // Get complete schema
  app.get("/api/schema", async (_req, res) => {
    try {
      const schema = await storage.getSchema();
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve schema" });
    }
  });

  // Get table by name
  app.get("/api/tables/:name", async (req, res) => {
    try {
      const tableName = req.params.name;
      const table = await storage.getTableByName(tableName);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve table" });
    }
  });

  // Search tables and columns
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const results = await storage.searchSchema(query);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Generate SQL for a specific module
  app.get("/api/sql/:moduleId", async (req, res) => {
    try {
      const moduleId = req.params.moduleId;
      const sql = await storage.generateSqlForModule(moduleId);
      
      res.json({ sql });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate SQL" });
    }
  });

  // Generate SQL for all modules
  app.get("/api/sql", async (_req, res) => {
    try {
      const sql = await storage.generateSqlForAllModules();
      
      res.json({ sql });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate SQL" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
