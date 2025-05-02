import { pgTable, text, serial, integer, boolean, timestamp, json, varchar, index, uuid, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database schema definition
export const tableSchema = pgTable("db_tables", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  moduleId: text("module_id").notNull(),
});

export const columnSchema = pgTable("db_columns", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tableSchema.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  isPrimaryKey: boolean("is_primary_key").default(false),
  isNotNull: boolean("is_not_null").default(false),
  isUnique: boolean("is_unique").default(false),
  isForeignKey: boolean("is_foreign_key").default(false),
  defaultValue: text("default_value"),
  referencesTable: text("references_table"),
  referencesColumn: text("references_column"),
});

export const indexSchema = pgTable("db_indexes", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull().references(() => tableSchema.id),
  name: text("name").notNull(),
  columns: text("columns").array().notNull(),
  unique: boolean("unique").default(false),
});

export const moduleSchema = pgTable("db_modules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const relationshipSchema = pgTable("db_relationships", {
  id: serial("id").primaryKey(),
  sourceTable: text("source_table").notNull(),
  targetTable: text("target_table").notNull(),
  sourceField: text("source_field"),
  targetField: text("target_field"),
  relationType: text("relation_type").notNull(),
  label: text("label"),
});

// User Authentication Tables
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auth_users = pgTable("auth_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  mobile_number: varchar("mobile_number", { length: 20 }).unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  roleId: uuid("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => {
  return {
    emailIdx: index("idx_auth_users_email").on(table.email),
    mobileIdx: index("idx_auth_users_mobile").on(table.mobile_number),
  }
});

// Session storage table
export const auth_sessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().references(() => auth_users.id),
  token_hash: varchar("token_hash", { length: 255 }).notNull(),
  device_info: jsonb("device_info"),
  ip_address: varchar("ip_address", { length: 45 }).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    sessionIdx: index("idx_auth_sessions_expires_at").on(table.expires_at),
    userIdx: index("idx_auth_sessions_user_id").on(table.user_id),
  }
});

// 2FA storage
export const auth_2fa = pgTable("auth_2fa", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => auth_users.id).notNull(),
  totp_secret: varchar("totp_secret", { length: 255 }),
  phone_number: varchar("phone_number", { length: 20 }),
  is_enabled: boolean("is_enabled").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Password reset tokens
export const auth_password_resets = pgTable("auth_password_resets", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => auth_users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  used_at: timestamp("used_at", { withTimezone: true }),
});

// Audit log for security events
export const auth_audit_logs = pgTable("auth_audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").references(() => auth_users.id),
  event_type: varchar("event_type", { length: 50 }).notNull(),
  event_timestamp: timestamp("event_timestamp", { withTimezone: true }).notNull().defaultNow(),
  ip_address: varchar("ip_address", { length: 50 }),
  user_agent: text("user_agent"),
  event_details: json("event_details"),
  resource_type: varchar("resource_type", { length: 50 }),
  resource_id: varchar("resource_id", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull(),
}, (table) => {
  return {
    userIdx: index("idx_audit_logs_user_id").on(table.user_id),
    eventTypeIdx: index("idx_audit_logs_event_type").on(table.event_type),
    eventTimestampIdx: index("idx_audit_logs_timestamp").on(table.event_timestamp),
  }
});

// Original sessions table - keeping for compatibility
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  }
);

// Insert schemas
export const insertTableSchema = createInsertSchema(tableSchema).omit({ id: true });
export const insertColumnSchema = createInsertSchema(columnSchema).omit({ id: true });
export const insertIndexSchema = createInsertSchema(indexSchema).omit({ id: true });
export const insertModuleSchema = createInsertSchema(moduleSchema).omit({ id: true });
export const insertRelationshipSchema = createInsertSchema(relationshipSchema).omit({ id: true });

// Role and User Insert schemas
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertAuthUserSchema = createInsertSchema(auth_users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true, 
  lastLogin: true,
  deletedAt: true
});
export const insertAuthSessionSchema = createInsertSchema(auth_sessions).omit({ 
  id: true, 
  created_at: true 
});
export const insertAuth2faSchema = createInsertSchema(auth_2fa).omit({ 
  id: true, 
  created_at: true, 
  updated_at: true 
});
export const insertAuthPasswordResetSchema = createInsertSchema(auth_password_resets).omit({ 
  id: true, 
  created_at: true, 
  used_at: true 
});
export const insertAuthAuditLogSchema = createInsertSchema(auth_audit_logs).omit({
  id: true,
  event_timestamp: true
});
export const insertSessionSchema = createInsertSchema(sessions);

// Types
export type Table = typeof tableSchema.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Column = typeof columnSchema.$inferSelect;
export type InsertColumn = z.infer<typeof insertColumnSchema>;

export type Index = typeof indexSchema.$inferSelect;
export type InsertIndex = z.infer<typeof insertIndexSchema>;

export type Module = typeof moduleSchema.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Relationship = typeof relationshipSchema.$inferSelect;
export type InsertRelationship = z.infer<typeof insertRelationshipSchema>;

// Role Types
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

// Auth User Types
export type AuthUser = typeof auth_users.$inferSelect;
export type InsertAuthUser = z.infer<typeof insertAuthUserSchema>;
export type AuthSession = typeof auth_sessions.$inferSelect;
export type InsertAuthSession = z.infer<typeof insertAuthSessionSchema>;
export type Auth2FA = typeof auth_2fa.$inferSelect;
export type InsertAuth2FA = z.infer<typeof insertAuth2faSchema>;
export type AuthPasswordReset = typeof auth_password_resets.$inferSelect;
export type InsertAuthPasswordReset = z.infer<typeof insertAuthPasswordResetSchema>;
export type AuthAuditLog = typeof auth_audit_logs.$inferSelect;
export type InsertAuthAuditLog = z.infer<typeof insertAuthAuditLogSchema>;

export type UpsertAuthUser = {
  username: string;
  email: string;
  mobile_number?: string;
  password: string;
  role?: string;
  roleId?: string;
  isActive?: boolean;
};

// For backward compatibility
export type User = AuthUser;
export type InsertUser = InsertAuthUser;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
