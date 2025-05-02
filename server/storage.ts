import { databaseSchema } from "../shared/database-schema";
import { DbModule, DbSchema, DbTable, generateSQL } from "@/lib/utils";
import { 
  User, InsertUser, Role, InsertRole, 
  AuthUser, InsertAuthUser, AuthSession, InsertAuthSession,
  Auth2FA, InsertAuth2FA, AuthPasswordReset, InsertAuthPasswordReset,
  AuthAuditLog, InsertAuthAuditLog, UpsertAuthUser
} from "@shared/schema";

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
  
  // User operations (for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createRole(roleData: InsertRole): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  
  // Advanced authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserLastLogin(userId: string): Promise<void>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  upsertUser(userData: UpsertAuthUser): Promise<User>;
  
  // Session management
  createSession(sessionData: InsertAuthSession): Promise<AuthSession>;
  getSessionByRefreshToken(refreshToken: string): Promise<AuthSession | undefined>;
  getSessionByToken(token: string): Promise<AuthSession | undefined>;
  updateSession(sessionId: string, updates: Partial<AuthSession>): Promise<AuthSession>;
  deleteSessionByToken(token: string): Promise<void>;
  invalidateAllUserSessions(userId: string): Promise<void>;
  
  // Two-factor authentication
  setupTwoFactorAuth(userId: string, totpSecret: string): Promise<Auth2FA>;
  getTwoFactorAuth(userId: string): Promise<Auth2FA | undefined>;
  updateTwoFactorAuth(userId: string, updates: Partial<Auth2FA>): Promise<Auth2FA>;
  
  // Password reset
  createPasswordReset(resetData: InsertAuthPasswordReset): Promise<AuthPasswordReset>;
  getPasswordResetByToken(token: string): Promise<AuthPasswordReset | undefined>;
  markPasswordResetUsed(token: string): Promise<void>;
  
  // Audit logging
  createAuditLog(logData: InsertAuthAuditLog): Promise<AuthAuditLog>;
  getAuditLogsByUser(userId: string, limit?: number, offset?: number): Promise<AuthAuditLog[]>;
  getAuditLogsByEventType(eventType: string, limit?: number, offset?: number): Promise<AuthAuditLog[]>;
  getAuditLogs(limit?: number, offset?: number): Promise<AuthAuditLog[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private schema: DbSchema;
  private users: User[] = [];
  private roles: Role[] = [];
  private sessions: AuthSession[] = [];
  private twoFactorAuth: Auth2FA[] = [];
  private passwordResets: AuthPasswordReset[] = [];
  private auditLogs: AuthAuditLog[] = [];
  
  constructor() {
    this.schema = databaseSchema;
    this._initializeRoles();
  }

  private async _initializeRoles() {
    // Create default roles if they don't exist
    const defaultRoles = [
      { name: "admin", description: "Administrator with full access" },
      { name: "user", description: "Regular user with limited access" }
    ];

    for (const roleData of defaultRoles) {
      const existingRole = this.roles.find(r => r.name === roleData.name);
      if (!existingRole) {
        await this.createRole({
          name: roleData.name,
          description: roleData.description
        });
      }
    }
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

  // User operations for standard authentication
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: crypto.randomUUID(),
      username: userData.username,
      email: userData.email,
      mobile_number: userData.mobile_number || null,
      password: userData.password,
      role: userData.role || "user",
      roleId: userData.roleId || null,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    
    this.users.push(user);
    return user;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const role: Role = {
      id: crypto.randomUUID(),
      name: roleData.name,
      description: roleData.description || null,
      createdAt: new Date()
    };
    
    this.roles.push(role);
    return role;
  }

  async getAllRoles(): Promise<Role[]> {
    return [...this.roles];
  }
  
  // Advanced authentication operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }
  
  async updateUserLastLogin(userId: string): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastLogin = new Date();
    }
  }
  
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }
  
  async upsertUser(userData: UpsertAuthUser): Promise<User> {
    let user = await this.getUserByEmail(userData.email);
    
    if (user) {
      // Update existing user
      Object.assign(user, {
        username: userData.username,
        email: userData.email,
        mobile_number: userData.mobile_number,
        password: userData.password,
        role: userData.role,
        roleId: userData.roleId,
        isActive: userData.isActive,
        updatedAt: new Date()
      });
    } else {
      // Create new user
      user = await this.createUser({
        username: userData.username,
        email: userData.email,
        mobile_number: userData.mobile_number,
        password: userData.password,
        role: userData.role,
        roleId: userData.roleId,
        isActive: userData.isActive
      });
    }
    
    return user;
  }
  
  // Session management
  async createSession(sessionData: InsertAuthSession): Promise<AuthSession> {
    const session: AuthSession = {
      id: crypto.randomUUID(),
      user_id: sessionData.user_id,
      token_hash: sessionData.token_hash,
      device_info: sessionData.device_info || null,
      ip_address: sessionData.ip_address,
      expires_at: sessionData.expires_at,
      created_at: new Date()
    };
    
    this.sessions.push(session);
    return session;
  }
  
  async getSessionByRefreshToken(refreshToken: string): Promise<AuthSession | undefined> {
    return this.sessions.find(session => session.token_hash === refreshToken);
  }
  
  async getSessionByToken(token: string): Promise<AuthSession | undefined> {
    return this.sessions.find(session => session.token_hash === token);
  }
  
  async updateSession(sessionId: string, updates: Partial<AuthSession>): Promise<AuthSession> {
    const session = this.sessions.find(session => session.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    Object.assign(session, updates);
    return session;
  }
  
  async deleteSessionByToken(token: string): Promise<void> {
    const index = this.sessions.findIndex(session => session.token_hash === token);
    if (index !== -1) {
      this.sessions.splice(index, 1);
    }
  }
  
  async invalidateAllUserSessions(userId: string): Promise<void> {
    this.sessions = this.sessions.filter(session => session.user_id !== userId);
  }
  
  // Two-factor authentication
  async setupTwoFactorAuth(userId: string, totpSecret: string): Promise<Auth2FA> {
    const twoFactorAuth: Auth2FA = {
      id: crypto.randomUUID(),
      user_id: userId,
      totp_secret: totpSecret,
      phone_number: null,
      is_enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    this.twoFactorAuth.push(twoFactorAuth);
    return twoFactorAuth;
  }
  
  async getTwoFactorAuth(userId: string): Promise<Auth2FA | undefined> {
    return this.twoFactorAuth.find(tfa => tfa.user_id === userId);
  }
  
  async updateTwoFactorAuth(userId: string, updates: Partial<Auth2FA>): Promise<Auth2FA> {
    const twoFactorAuth = await this.getTwoFactorAuth(userId);
    if (!twoFactorAuth) {
      throw new Error("Two-factor authentication not found");
    }
    
    Object.assign(twoFactorAuth, updates, { updated_at: new Date() });
    return twoFactorAuth;
  }
  
  // Password reset
  async createPasswordReset(resetData: InsertAuthPasswordReset): Promise<AuthPasswordReset> {
    const reset: AuthPasswordReset = {
      id: crypto.randomUUID(),
      user_id: resetData.user_id,
      token: resetData.token,
      expires_at: resetData.expires_at,
      created_at: new Date(),
      used_at: null
    };
    
    this.passwordResets.push(reset);
    return reset;
  }
  
  async getPasswordResetByToken(token: string): Promise<AuthPasswordReset | undefined> {
    return this.passwordResets.find(reset => reset.token === token);
  }
  
  async markPasswordResetUsed(token: string): Promise<void> {
    const passwordReset = await this.getPasswordResetByToken(token);
    if (passwordReset) {
      passwordReset.used_at = new Date();
    }
  }
  
  // Audit logging
  async createAuditLog(logData: InsertAuthAuditLog): Promise<AuthAuditLog> {
    const auditLog: AuthAuditLog = {
      id: crypto.randomUUID(),
      user_id: logData.user_id || null,
      event_type: logData.event_type,
      event_timestamp: new Date(),
      ip_address: logData.ip_address || null,
      user_agent: logData.user_agent || null,
      event_details: logData.event_details || null,
      resource_type: logData.resource_type || null,
      resource_id: logData.resource_id || null,
      status: logData.status
    };
    
    this.auditLogs.push(auditLog);
    return auditLog;
  }
  
  async getAuditLogsByUser(userId: string, limit: number = 100, offset: number = 0): Promise<AuthAuditLog[]> {
    return this.auditLogs
      .filter(log => log.user_id === userId)
      .slice(offset, offset + limit);
  }
  
  async getAuditLogsByEventType(eventType: string, limit: number = 100, offset: number = 0): Promise<AuthAuditLog[]> {
    const eventLogs = this.auditLogs
      .filter(log => log.event_type === eventType)
      .sort((a, b) => b.event_timestamp.getTime() - a.event_timestamp.getTime());
    
    return eventLogs.slice(offset, offset + limit);
  }
  
  async getAuditLogs(limit: number = 100, offset: number = 0): Promise<AuthAuditLog[]> {
    const sortedLogs = [...this.auditLogs].sort((a, b) => 
      b.event_timestamp.getTime() - a.event_timestamp.getTime()
    );
    
    return sortedLogs.slice(offset, offset + limit);
  }
}

// Export storage instance
export const storage = new MemStorage();