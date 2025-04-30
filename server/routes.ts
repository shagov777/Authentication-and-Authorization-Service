import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
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
