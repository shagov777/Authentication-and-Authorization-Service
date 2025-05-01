import { db } from "./db";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool } from "@neondatabase/serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

async function main() {
  console.log("Pushing database schema...");
  
  try {
    // Use migrate method to create schema
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log("Database schema pushed successfully!");
  } catch (error) {
    console.error("Failed to push database schema:", error);
    
    // Fallback to manual table creation
    console.log("Falling back to manual table creation...");
    
    // Drop tables if they exist
    await db.execute(`
      DROP TABLE IF EXISTS "sessions";
      DROP TABLE IF EXISTS "auth_2fa";
      DROP TABLE IF EXISTS "auth_password_resets";
      DROP TABLE IF EXISTS "auth_sessions";
      DROP TABLE IF EXISTS "auth_users";
      DROP TABLE IF EXISTS "roles";
    `);
    
    // Create tables manually
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR UNIQUE NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "auth_users" (
        "id" SERIAL PRIMARY KEY,
        "username" VARCHAR(50) UNIQUE NOT NULL,
        "email" VARCHAR(255) UNIQUE NOT NULL,
        "mobile_number" VARCHAR(20) UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "role" VARCHAR(50) NOT NULL DEFAULT 'user',
        "role_id" INTEGER REFERENCES "roles"("id"),
        "is_active" BOOLEAN DEFAULT TRUE,
        "last_login" TIMESTAMP,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW(),
        "deleted_at" TIMESTAMP
      );
      
      CREATE INDEX "idx_auth_users_email" ON "auth_users"("email");
      CREATE INDEX "idx_auth_users_mobile" ON "auth_users"("mobile_number");
      
      CREATE TABLE IF NOT EXISTS "auth_sessions" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "auth_users"("id"),
        "session_id" VARCHAR(255) UNIQUE NOT NULL,
        "jwt_token" VARCHAR(2000),
        "refresh_token" VARCHAR(255),
        "ip_address" VARCHAR(50),
        "device_info" TEXT,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE INDEX "idx_auth_sessions_session_id" ON "auth_sessions"("session_id");
      CREATE INDEX "idx_auth_sessions_user_id" ON "auth_sessions"("user_id");
      
      CREATE TABLE IF NOT EXISTS "auth_2fa" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "auth_users"("id"),
        "totp_secret" VARCHAR(255),
        "phone_number" VARCHAR(20),
        "is_enabled" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "auth_password_resets" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "auth_users"("id"),
        "token" VARCHAR(255) NOT NULL,
        "expires_at" TIMESTAMP NOT NULL,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "used_at" TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" VARCHAR PRIMARY KEY,
        "sess" JSON NOT NULL,
        "expire" TIMESTAMP NOT NULL
      );
    `);
    
    // Insert default roles
    await db.execute(`
      INSERT INTO "roles" ("name", "description") 
      VALUES 
        ('admin', 'Administrator with full access'),
        ('user', 'Regular user with limited access')
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log("Database setup complete!");
  }
}

main().catch(console.error);