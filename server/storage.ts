import { databaseSchema } from "../shared/database-schema";
import { DbModule, DbSchema, DbTable, generateSQL } from "@/lib/utils";
import { 
  User, InsertUser, Role, InsertRole, 
  AuthUser, InsertAuthUser, AuthSession, InsertAuthSession,
  Auth2FA, InsertAuth2FA, AuthPasswordReset, InsertAuthPasswordReset,
  UpsertAuthUser
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
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  createRole(roleData: InsertRole): Promise<Role>;
  getAllRoles(): Promise<Role[]>;
  
  // Advanced authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserLastLogin(userId: number): Promise<void>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  upsertUser(userData: UpsertAuthUser): Promise<User>;
  
  // Session management
  createSession(sessionData: InsertAuthSession): Promise<AuthSession>;
  getSessionByRefreshToken(refreshToken: string): Promise<AuthSession | undefined>;
  getSessionByToken(token: string): Promise<AuthSession | undefined>;
  updateSession(sessionId: number, updates: Partial<AuthSession>): Promise<AuthSession>;
  deleteSessionByToken(token: string): Promise<void>;
  invalidateAllUserSessions(userId: number): Promise<void>;
  
  // Two-factor authentication
  setupTwoFactorAuth(userId: number, totpSecret: string): Promise<Auth2FA>;
  getTwoFactorAuth(userId: number): Promise<Auth2FA | undefined>;
  updateTwoFactorAuth(userId: number, updates: Partial<Auth2FA>): Promise<Auth2FA>;
  
  // Password reset
  createPasswordReset(resetData: InsertAuthPasswordReset): Promise<AuthPasswordReset>;
  getPasswordResetByToken(token: string): Promise<AuthPasswordReset | undefined>;
  markPasswordResetUsed(token: string): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private schema: DbSchema;
  private users: User[] = [];
  private roles: Role[] = [];
  private sessions: AuthSession[] = [];
  private twoFactorAuth: Auth2FA[] = [];
  private passwordResets: AuthPasswordReset[] = [];
  
  private nextUserId = 1;
  private nextRoleId = 1;
  private nextSessionId = 1;
  private nextTwoFactorId = 1;
  private nextPasswordResetId = 1;

  constructor() {
    this.schema = databaseSchema;
    
    // Add default roles
    this._initializeRoles();
  }

  private async _initializeRoles() {
    await this.createRole({
      name: "admin",
      description: "Administrator with full access"
    });
    
    await this.createRole({
      name: "user",
      description: "Regular user with limited access"
    });
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
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.nextUserId++,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      mobile_number: userData.mobile_number || null,
      role: userData.role || "user",
      roleId: userData.roleId || 2, // Default to 'user' role if not specified
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };
    
    this.users.push(newUser);
    return newUser;
  }

  async createRole(roleData: InsertRole): Promise<Role> {
    const role: Role = {
      id: this.nextRoleId++,
      name: roleData.name,
      description: roleData.description || null,
      createdAt: new Date(),
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
  
  async updateUserLastLogin(userId: number): Promise<void> {
    const user = await this.getUser(userId);
    if (user) {
      user.lastLogin = new Date();
    }
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Apply updates
    Object.assign(user, updates, { updatedAt: new Date() });
    return user;
  }
  
  async upsertUser(userData: UpsertAuthUser): Promise<User> {
    // Check if user already exists
    let user = await this.getUserByUsername(userData.username);
    
    if (user) {
      // Update existing user
      if (userData.email) user.email = userData.email;
      if (userData.mobile_number) user.mobile_number = userData.mobile_number;
      if (userData.password) user.password = userData.password;
      if (userData.role) user.role = userData.role;
      if (userData.roleId) user.roleId = userData.roleId;
      if (userData.isActive !== undefined) user.isActive = userData.isActive;
      
      user.updatedAt = new Date();
      return user;
    } else {
      // Create new user
      return this.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password || 'defaultpassword', // Should not happen in practice
        mobile_number: userData.mobile_number,
        role: userData.role,
        roleId: userData.roleId,
        isActive: userData.isActive
      });
    }
  }
  
  // Session management
  async createSession(sessionData: InsertAuthSession): Promise<AuthSession> {
    const session: AuthSession = {
      id: this.nextSessionId++,
      user_id: sessionData.user_id,
      session_id: sessionData.session_id,
      jwt_token: sessionData.jwt_token || null,
      refresh_token: sessionData.refresh_token || null,
      ip_address: sessionData.ip_address || null,
      device_info: sessionData.device_info || null,
      expires_at: sessionData.expires_at,
      created_at: new Date()
    };
    
    this.sessions.push(session);
    return session;
  }
  
  async getSessionByRefreshToken(refreshToken: string): Promise<AuthSession | undefined> {
    return this.sessions.find(session => session.refresh_token === refreshToken);
  }
  
  async getSessionByToken(token: string): Promise<AuthSession | undefined> {
    return this.sessions.find(session => session.jwt_token === token);
  }
  
  async updateSession(sessionId: number, updates: Partial<AuthSession>): Promise<AuthSession> {
    const session = this.sessions.find(session => session.id === sessionId);
    if (!session) {
      throw new Error("Session not found");
    }
    
    Object.assign(session, updates);
    return session;
  }
  
  async deleteSessionByToken(token: string): Promise<void> {
    const index = this.sessions.findIndex(session => session.jwt_token === token);
    if (index !== -1) {
      this.sessions.splice(index, 1);
    }
  }
  
  async invalidateAllUserSessions(userId: number): Promise<void> {
    this.sessions = this.sessions.filter(session => session.user_id !== userId);
  }
  
  // Two-factor authentication
  async setupTwoFactorAuth(userId: number, totpSecret: string): Promise<Auth2FA> {
    // Check if user already has 2FA
    const existing = await this.getTwoFactorAuth(userId);
    if (existing) {
      existing.totp_secret = totpSecret;
      existing.updated_at = new Date();
      return existing;
    }
    
    // Create new 2FA record
    const twoFactorAuth: Auth2FA = {
      id: this.nextTwoFactorId++,
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
  
  async getTwoFactorAuth(userId: number): Promise<Auth2FA | undefined> {
    return this.twoFactorAuth.find(tfa => tfa.user_id === userId);
  }
  
  async updateTwoFactorAuth(userId: number, updates: Partial<Auth2FA>): Promise<Auth2FA> {
    const twoFactorAuth = await this.getTwoFactorAuth(userId);
    if (!twoFactorAuth) {
      throw new Error("Two-factor authentication not found");
    }
    
    Object.assign(twoFactorAuth, updates, { updated_at: new Date() });
    return twoFactorAuth;
  }
  
  // Password reset
  async createPasswordReset(resetData: InsertAuthPasswordReset): Promise<AuthPasswordReset> {
    const passwordReset: AuthPasswordReset = {
      id: this.nextPasswordResetId++,
      user_id: resetData.user_id,
      token: resetData.token,
      expires_at: resetData.expires_at,
      created_at: new Date(),
      used_at: null
    };
    
    this.passwordResets.push(passwordReset);
    return passwordReset;
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
}

// Export storage instance
export const storage = new MemStorage();