import { db } from "./db";
import { users, sessions } from "@shared/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";

async function main() {
  console.log("Dropping and recreating database tables...");
  
  // Drop tables if they exist
  await db.execute(`
    DROP TABLE IF EXISTS "sessions";
    DROP TABLE IF EXISTS "users";
  `);
  
  // Create users and sessions tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" VARCHAR PRIMARY KEY NOT NULL,
      "username" VARCHAR UNIQUE NOT NULL,
      "email" VARCHAR UNIQUE,
      "first_name" VARCHAR,
      "last_name" VARCHAR,
      "bio" TEXT,
      "profile_image_url" VARCHAR,
      "created_at" TIMESTAMP DEFAULT NOW(),
      "updated_at" TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" VARCHAR PRIMARY KEY,
      "sess" JSON NOT NULL,
      "expire" TIMESTAMP NOT NULL
    );
  `);
  
  console.log("Database setup complete!");
}

main().catch(console.error);