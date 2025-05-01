# Database Schema Visualization Tool Documentation

## Overview

This document describes the Database Schema Visualization Tool, a comprehensive application for visualizing and managing PostgreSQL database schemas. The tool provides an interactive way to explore complex database architectures through multiple views and generates SQL scripts for implementation.

## Core Components

### Data Model

The system uses the following data model to represent database schemas:

```typescript
// Basic schema components
type DbColumn = {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isNotNull?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  references?: {
    table: string;
    column: string;
  };
};

type DbIndex = {
  name: string;
  columns: string[];
  unique?: boolean;
};

type DbTable = {
  name: string;
  description?: string;
  columns: DbColumn[];
  indexes?: DbIndex[];
  constraints?: string[];
};

type DbModule = {
  name: string;
  description?: string;
  tables: DbTable[];
};

type DbRelationship = {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label: string;
  type: "one-to-one" | "one-to-many" | "many-to-many";
};

type DbSchema = {
  modules: DbModule[];
  relationships: DbRelationship[];
};
```

### Database Structure

The tool uses the following database tables to store schema metadata:

1. `db_modules` - Stores logical groupings of database tables (e.g., Authentication, Profile, Wallet)
2. `db_tables` - Stores table definitions with references to their parent modules
3. `db_columns` - Stores column definitions with references to their parent tables
4. `db_indexes` - Stores index definitions for tables
5. `db_relationships` - Stores relationships between tables

### Key Views

The application consists of multiple views designed to provide different perspectives on the database schema:

1. **Module View**: Displays tables within a specific functional module (e.g., Authentication, Profiles)
2. **ER Diagram**: Shows a complete entity-relationship diagram across all modules
3. **SQL Generator**: Generates PostgreSQL-compatible SQL scripts for schema implementation
4. **Conventions**: Documents database naming conventions and best practices

## Technical Components

### Frontend

1. **React Flow** for interactive diagram visualization
   - Custom node components for tables
   - Edge components for relationships
   - Zoom and pan controls for navigation

2. **Navigation**
   - Sidebar for module selection
   - Tab navigation for different views

3. **Table Details**
   - Table information panel
   - Column listing with type information
   - Primary and foreign key indicators

### Backend

1. **Storage Layer**
   - Interface for database operations
   - Methods for retrieving modules, tables, and relationships
   - SQL generation capabilities

2. **API Endpoints**
   - GET `/api/modules` - List all modules
   - GET `/api/modules/:id` - Get specific module and its tables
   - GET `/api/schema` - Get complete schema
   - GET `/api/tables/:name` - Get specific table details
   - GET `/api/search?q=query` - Search tables and columns
   - GET `/api/sql/:moduleId` - Generate SQL for a specific module
   - GET `/api/sql` - Generate SQL for all modules

## Implementation Requirements for New Modules

When implementing new modules in this system, ensure they follow these specifications:

### 1. Module Structure

Each module should be defined with:
- A unique name
- A description explaining the module's purpose
- A collection of logically related tables

### 2. Table Requirements

Tables within a module should:
- Have a descriptive name (snake_case preferred)
- Include a detailed description of the table's purpose
- Have a primary key (typically `id` with serial/integer type)
- Follow consistent naming conventions
- Include appropriate indexes for performance

### 3. Column Requirements

Columns should be defined with:
- A clear, descriptive name
- Appropriate PostgreSQL data type
- NOT NULL constraint where appropriate
- Default values when needed
- References to other tables when implementing foreign keys

### 4. Relationship Requirements

When defining relationships:
- Specify the relationship type (one-to-one, one-to-many, many-to-many)
- For many-to-many relationships, create a junction table
- Use consistent naming patterns for foreign keys (e.g., `parent_table_id`)
- Ensure referential integrity with appropriate constraints

### 5. Indexing Guidelines

- Add unique indexes on columns requiring uniqueness constraints
- Create indexes on columns frequently used in WHERE clauses
- Add indexes on foreign key columns
- Use composite indexes for queries that filter on multiple columns together

### 6. SQL Generation

Ensure that all tables can be properly generated with:
- CREATE TABLE statements with proper column definitions
- Primary key constraints
- Foreign key constraints
- Index definitions
- CHECK constraints where appropriate

## Usage Guide

1. Select a module from the sidebar to view its tables
2. Click on a table to view detailed information about its columns
3. Switch to ER Diagram view to see relationships between tables
4. Use the SQL Generator to create implementation scripts
5. Refer to Conventions for database design best practices

## Authentication Integration

The visualization tool has been enhanced with authentication capabilities:

1. User authentication database schema
2. Secure password handling with salted hashing
3. Session management
4. Protected routes for authenticated users

This addition allows the tool to be secured while maintaining all visualization functionality.

---

This documentation should be used as a reference when creating new database modules to ensure consistency across the entire database schema.