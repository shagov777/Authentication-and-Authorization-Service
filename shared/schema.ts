import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
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
  id: serial("id").primaryKey(),
  name: varchar("name").unique().notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  bio: text("bio"),
  profileImageUrl: varchar("profile_image_url"),
  roleId: integer("role_id").references(() => roles.id),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table required for Replit Auth
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });

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

// User Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = {
  username: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  profileImageUrl?: string;
  roleId?: number;
  isActive?: boolean;
};

export type CreateUser = Omit<UpsertUser, 'password'> & {
  password: string;
};

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
