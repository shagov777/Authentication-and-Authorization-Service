#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
while ! pg_isready -U postgres -h localhost; do
  sleep 1
done

# Create the database if it doesn't exist
echo "Creating database if it doesn't exist..."
psql -v ON_ERROR_STOP=1 --username postgres <<-EOSQL
    CREATE DATABASE auth;
EOSQL

# Connect to the auth database and create tables
echo "Creating tables..."
psql -v ON_ERROR_STOP=1 --username postgres --dbname auth <<-EOSQL
    -- Create auth_users table
    CREATE TABLE IF NOT EXISTS auth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(50) UNIQUE,
        role VARCHAR(20) NOT NULL DEFAULT 'player',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP WITH TIME ZONE
    );

    -- Create auth_sessions table
    CREATE TABLE IF NOT EXISTS auth_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth_users(id),
        token_hash VARCHAR(255) NOT NULL,
        device_info JSONB,
        ip_address VARCHAR(45) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);
    CREATE INDEX IF NOT EXISTS idx_auth_users_username ON auth_users(username);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

    -- Insert default admin user
    INSERT INTO auth_users (email, password_hash, role, username)
    VALUES ('admin@example.com', '\$2b\$10\$XQv0yY7Uv6xZQqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXqXq', 'admin', 'admin')
    ON CONFLICT (email) DO NOTHING;
EOSQL

echo "Database initialization complete!" 