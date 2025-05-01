import { databaseSchema } from "../shared/database-schema";
import { DbModule, DbSchema, DbTable, generateSQL } from "@/lib/utils";
import { User, UpsertUser } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

// Define storage interface
export interface IStorage {
  // Schema-related operations
  getSchema(): Promise<DbSchema>;
  getAllModules(): Promise<DbModule[]>;
  getModuleById(id: string): Promise<DbModule | undefined>;
  getTableByName(name: string): Promise<DbTable | undefined>;
  searchSchema(query: string): Promise<{ tables: DbTable[], columns: { table: string, column: any }[] }>;
  generateSqlForModule(moduleId: string): Promise<string>;
  generateSqlForAllModules(): Promise<string>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private schema: DbSchema;

  constructor() {
    this.schema = databaseSchema;
  }

  // Schema-related methods
  async getSchema(): Promise<DbSchema> {
    return this.schema;
  }

  async getAllModules(): Promise<DbModule[]> {
    return this.schema.modules;
  }

  async getModuleById(id: string): Promise<DbModule | undefined> {
    return this.schema.modules.find(module => 
      module.name.toLowerCase().includes(id.toLowerCase())
    );
  }

  async getTableByName(name: string): Promise<DbTable | undefined> {
    for (const module of this.schema.modules) {
      const table = module.tables.find(table => table.name === name);
      if (table) {
        return table;
      }
    }
    return undefined;
  }

  async searchSchema(query: string): Promise<{ tables: DbTable[], columns: { table: string, column: any }[] }> {
    const normalizedQuery = query.toLowerCase();
    const tables: DbTable[] = [];
    const columns: { table: string, column: any }[] = [];

    for (const module of this.schema.modules) {
      for (const table of module.tables) {
        // Search in table names
        if (table.name.toLowerCase().includes(normalizedQuery)) {
          tables.push(table);
        }

        // Search in columns
        for (const column of table.columns) {
          if (column.name.toLowerCase().includes(normalizedQuery) ||
              (column.description && column.description.toLowerCase().includes(normalizedQuery))) {
            columns.push({ table: table.name, column });
          }
        }
      }
    }

    return { tables, columns };
  }

  async generateSqlForModule(moduleId: string): Promise<string> {
    const module = await this.getModuleById(moduleId);
    
    if (!module) {
      return "-- No module found with the specified ID";
    }
    
    let sql = `-- ${module.name} Tables\n\n`;
    
    // Generate SQL for tables
    for (const table of module.tables) {
      sql += generateSQL(table.name, table.columns, table.constraints) + "\n\n";
    }
    
    // Generate SQL for indexes
    for (const table of module.tables) {
      if (table.indexes && table.indexes.length > 0) {
        sql += `-- Indexes for ${table.name}\n`;
        for (const index of table.indexes) {
          const uniqueStr = index.unique ? "UNIQUE " : "";
          sql += `CREATE ${uniqueStr}INDEX ${index.name} ON ${table.name}(${index.columns.join(", ")});\n`;
        }
        sql += "\n";
      }
    }
    
    return sql;
  }

  async generateSqlForAllModules(): Promise<string> {
    let sql = "-- Generated SQL Script for All Modules\n\n";
    
    for (const module of this.schema.modules) {
      sql += `-- ${module.name} Tables\n\n`;
      
      // Generate SQL for tables
      for (const table of module.tables) {
        sql += generateSQL(table.name, table.columns, table.constraints) + "\n\n";
      }
      
      // Generate SQL for indexes
      for (const table of module.tables) {
        if (table.indexes && table.indexes.length > 0) {
          sql += `-- Indexes for ${table.name}\n`;
          for (const index of table.indexes) {
            const uniqueStr = index.unique ? "UNIQUE " : "";
            sql += `CREATE ${uniqueStr}INDEX ${index.name} ON ${table.name}(${index.columns.join(", ")});\n`;
          }
          sql += "\n";
        }
      }
    }
    
    return sql;
  }

  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return user;
  }
}

// Export storage instance
export const storage = new MemStorage();