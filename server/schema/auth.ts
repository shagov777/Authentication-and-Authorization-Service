import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Auth Users Table
export const auth_users = pgTable('auth_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  mobile_number: text('mobile_number'),
  password_hash: text('password_hash').notNull(),
  role: text('role').notNull().default('user'),
  is_active: boolean('is_active').notNull().default(true),
  failed_login_attempts: integer('failed_login_attempts').notNull().default(0),
  last_failed_login_at: timestamp('last_failed_login_at'),
  last_login_at: timestamp('last_login_at'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  deleted_at: timestamp('deleted_at'),
});

// Auth Sessions Table
export const auth_sessions = pgTable('auth_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => auth_users.id),
  token: text('token').notNull(),
  refresh_token: text('refresh_token').notNull(),
  device_info: jsonb('device_info'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Auth 2FA Table
export const auth_2fa = pgTable('auth_2fa', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => auth_users.id),
  secret: text('secret').notNull(),
  backup_codes: text('backup_codes').array().notNull(),
  is_enabled: boolean('is_enabled').notNull().default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Auth Password Resets Table
export const auth_password_resets = pgTable('auth_password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => auth_users.id),
  token: text('token').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const authUsersRelations = relations(auth_users, ({ many }) => ({
  sessions: many(auth_sessions),
  twoFactorAuth: many(auth_2fa),
  passwordResets: many(auth_password_resets),
}));

export const authSessionsRelations = relations(auth_sessions, ({ one }) => ({
  user: one(auth_users, {
    fields: [auth_sessions.user_id],
    references: [auth_users.id],
  }),
}));

export const auth2faRelations = relations(auth_2fa, ({ one }) => ({
  user: one(auth_users, {
    fields: [auth_2fa.user_id],
    references: [auth_users.id],
  }),
}));

export const authPasswordResetsRelations = relations(auth_password_resets, ({ one }) => ({
  user: one(auth_users, {
    fields: [auth_password_resets.user_id],
    references: [auth_users.id],
  }),
})); 