import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up standard authentication
  setupAuth(app);
  
  // Authentication routes
  app.get('/api/user', isAuthenticated, (req, res) => {
    const user = req.user;
    // Only send non-sensitive user information
    res.json({
      id: user.id,
      username: user.username
    });
  });
  
  // Schema routes
  app.get('/api/schema', async (req, res) => {
    try {
      const schema = await storage.getSchema();
      res.json(schema);
    } catch (error) {
      console.error("Error fetching schema:", error);
      res.status(500).json({ message: "Failed to fetch schema" });
    }
  });
  
  app.get('/api/modules', async (req, res) => {
    try {
      const modules = await storage.getAllModules();
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ message: "Failed to fetch modules" });
    }
  });
  
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