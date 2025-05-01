# Docker Deployment Guide

This guide provides detailed instructions for deploying the PostgreSQL Database Schema Manager with Docker on your own server. Follow these steps to successfully migrate from the Replit environment to a Docker-based deployment.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Environment Configuration](#environment-configuration)
- [Removing Replit-Specific Code](#removing-replit-specific-code)
- [Database Setup](#database-setup)
- [Docker Configuration](#docker-configuration)
- [Building and Running the Container](#building-and-running-the-container)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have the following installed:
- Docker and Docker Compose
- Node.js (for local development if needed)
- PostgreSQL (either as a Docker container or external database)
- Git (to clone the repository)

## Project Structure

After removal of Replit-specific code, the project structure should look like this:

```
project-root/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   ├── pages/       # Page components
│   │   ├── App.tsx      # Main application component
│   │   └── main.tsx     # Entry point
│   └── index.html       # HTML template
├── server/              # Backend Express application
│   ├── authentication.ts # Authentication module
│   ├── db.ts            # Database connection
│   ├── index.ts         # Express server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage interface
│   └── vite.ts          # Vite integration for development
├── shared/              # Shared code between client and server
│   └── schema.ts        # Database schema definitions
├── docker/              # Docker configuration files
│   ├── Dockerfile       # Main Dockerfile
│   └── docker-compose.yml # Compose file for local development
├── .env.example         # Example environment variables
├── package.json         # Node.js dependencies
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Environment Configuration

1. Create a `.env` file in the project root with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
PGUSER=username
PGHOST=hostname
PGPASSWORD=password
PGDATABASE=database_name
PGPORT=5432

# Application Configuration
PORT=5000
NODE_ENV=production

# Security
SESSION_SECRET=your_strong_session_secret
JWT_SECRET=your_strong_jwt_secret
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=https://your-frontend-domain.com
```

2. Replace the placeholder values with your actual configuration.

## Removing Replit-Specific Code

### 1. Authentication Module

Remove the Replit-specific authentication code:

1. Delete the `server/replitAuth.ts` file
2. Ensure all auth references in `server/routes.ts` point to `authentication.ts` instead of `replitAuth.ts`

### 2. Vite Configuration

Update the Vite configuration in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
```

### 3. Server Index

Update the server index file (`server/index.ts`) to remove Replit-specific code:

```typescript
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { registerRoutes } from './routes';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Register routes
const server = registerRoutes(app);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Database Setup

1. Create a PostgreSQL database either:
   - On your server
   - As a Docker container
   - Using a cloud provider (AWS RDS, GCP Cloud SQL, etc.)

2. Run the database migrations:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push
```

## Docker Configuration

### Dockerfile

Create a `Dockerfile` in the project root:

```dockerfile
# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:client

# Stage 2: Build backend
FROM node:20-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:server

# Stage 3: Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=backend-build /app/dist ./dist
COPY --from=frontend-build /app/dist/client ./dist/client
COPY package*.json ./
RUN npm install --production

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["node", "dist/server/index.js"]
```

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  # Application service
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
      - PGUSER=postgres
      - PGHOST=db
      - PGPASSWORD=postgres
      - PGDATABASE=postgres
      - PGPORT=5432
      - SESSION_SECRET=your_strong_session_secret
      - JWT_SECRET=your_strong_jwt_secret
      - CORS_ORIGIN=*
    networks:
      - app-network
    restart: unless-stopped

  # Database service (for development)
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    networks:
      - app-network
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
```

## Building and Running the Container

### Manual Build and Run

```bash
# Build the Docker image
docker build -t postgres-schema-manager .

# Run the container
docker run -p 5000:5000 --env-file .env postgres-schema-manager
```

### Using Docker Compose

```bash
# Start services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Security Considerations

1. **Environment Variables**: Never commit your `.env` file to version control. Use Docker secrets or environment variables for sensitive data.

2. **Database Access**: Use a dedicated database user with minimal permissions required for your application.

3. **CORS Configuration**: Restrict CORS to your specific domain in production.

4. **JWT Secret**: Use a strong, unique secret for your JWT tokens.

5. **Postgres Password**: Use a strong, unique password for your PostgreSQL database.

6. **Network Security**: Use Docker networks to isolate your application.

7. **Secrets Management**: Consider using Docker secrets or a dedicated secrets management solution for sensitive environment variables.

## Troubleshooting

### Common Issues

1. **Database Connection Errors**:
   - Ensure your PostgreSQL instance is running and accessible
   - Verify the `DATABASE_URL` environment variable is correct
   - Check network connectivity between the application and database

2. **API Endpoint Errors**:
   - Check browser console for CORS errors
   - Verify your API endpoints are correctly configured in the frontend

3. **Authentication Issues**:
   - Ensure your JWT_SECRET is set correctly
   - Check that sessions are being properly stored and retrieved

### Viewing Logs

```bash
# View container logs
docker logs postgres-schema-manager

# View logs with Docker Compose
docker-compose logs -f app
```

### Debugging

For an interactive debugging session:

```bash
# Run a shell in the container
docker exec -it postgres-schema-manager sh

# Check environment variables
env | grep PG

# Test database connection
node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query('SELECT NOW()', (err, res) => { console.log(err, res); pool.end(); });"
```