# Database Schema Visualization Tool - Technical Specification

## Architecture Overview

This document provides detailed technical specifications for the Database Schema Visualization Tool. It serves as a guide for future development and integration of new database modules.

## Technology Stack

- **Frontend**: React, TypeScript, ReactFlow, shadcn/ui components
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Custom implementation with secure password hashing

## Database Schema Definition

### Core Schema Tables

```typescript
// Database meta-schema tables
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

// Authentication tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Component Architecture

### Frontend Structure

```
client/
├── src/
│   ├── components/
│   │   ├── SchemaFlow.tsx        # React Flow visualization component
│   │   ├── SchemaTable.tsx       # Table node visualization
│   │   ├── TableDetails.tsx      # Table details panel
│   │   ├── ModuleSelector.tsx    # Module selection component
│   │   ├── NavBar.tsx            # Application navigation bar
│   │   └── Sidebar.tsx           # Sidebar navigation
│   ├── pages/
│   │   ├── DatabaseVisualizer.tsx # Main application page
│   │   ├── ModuleView.tsx         # Module-specific view
│   │   ├── ERDiagram.tsx          # Entity-relationship diagram view
│   │   ├── SqlGenerator.tsx       # SQL script generation view
│   │   └── Conventions.tsx        # Database conventions view
│   ├── lib/
│   │   ├── utils.ts               # Utility functions and types
│   │   └── queryClient.ts         # API query client
│   ├── App.tsx                    # Application root component
│   └── main.tsx                   # Application entry point
```

### Backend Structure

```
server/
├── index.ts                      # Server entry point
├── routes.ts                     # API route definitions
├── storage.ts                    # Data storage interface and implementation
├── db.ts                         # Database connection
└── vite.ts                       # Vite server configuration
```

### Shared Code

```
shared/
├── schema.ts                     # Shared database schema definitions
└── database-schema.ts            # Application database schema data
```

## Key Implementation Details

### Storage Interface

The `IStorage` interface defines all operations for database access:

```typescript
export interface IStorage {
  // Schema-related operations
  getSchema(): Promise<DbSchema>;
  getAllModules(): Promise<DbModule[]>;
  getModuleById(id: string): Promise<DbModule | undefined>;
  getTableByName(name: string): Promise<DbTable | undefined>;
  searchSchema(query: string): Promise<{ tables: DbTable[], columns: { table: string, column: any }[] }>;
  generateSqlForModule(moduleId: string): Promise<string>;
  generateSqlForAllModules(): Promise<string>;
  
  // User authentication operations
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  validateUser(username: string, password: string): Promise<User | null>;
  createSession(userId: number): Promise<string>;
  validateSession(token: string): Promise<User | null>;
  deleteSession(token: string): Promise<void>;
}
```

### React Flow Implementation

The diagram visualization uses React Flow with the following key components:

1. Custom node types for table representation
2. Edge definitions for relationship visualization
3. Layout algorithms for positioning nodes
4. Event handlers for user interaction

Example node generation:
```typescript
const generateLayout = useCallback((tables: DbTable[]) => {
  const HORIZONTAL_SPACING = 300;
  const VERTICAL_SPACING = 300;
  const NODES_PER_ROW = fullDiagram ? 5 : 3;

  return tables.map((table, index) => {
    const row = Math.floor(index / NODES_PER_ROW);
    const col = index % NODES_PER_ROW;

    return {
      id: table.name,
      type: 'tableNode',
      data: {
        tableName: table.name,
        columns: table.columns,
        moduleId: moduleId
      },
      position: {
        x: col * HORIZONTAL_SPACING + 50,
        y: row * VERTICAL_SPACING + 50
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left
    };
  });
}, [fullDiagram, moduleId]);
```

Example edge generation:
```typescript
const generateEdges = useCallback(() => {
  if (!isInitialized || tables.length === 0) return [];
  
  try {
    const edges: Edge[] = [];
    
    // Generate edges from foreign keys
    tables.forEach(table => {
      table.columns.forEach(column => {
        if (column.isForeignKey && column.references && tableNames.includes(column.references.table)) {
          const uniqueId = `fk-${Math.random().toString(36).substring(2, 9)}`;
          
          edges.push({
            id: uniqueId,
            source: table.name,
            target: column.references.table,
            type: 'default',
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 15,
              height: 15
            },
            label: column.name,
            labelBgStyle: { fill: 'white' },
            labelStyle: { fontSize: 10 },
            style: { strokeWidth: 1.5 },
            className: 'flow-edge-foreign'
          });
        }
      });
    });
    
    // Add filtered relationships
    filteredRelationships.forEach((rel, index) => {
      const uniqueId = `rel-${Math.random().toString(36).substring(2, 9)}`;
      
      edges.push({
        id: uniqueId,
        source: rel.source,
        target: rel.target,
        type: 'default',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15
        },
        label: rel.label,
        labelBgStyle: { fill: 'white' },
        labelStyle: { fontSize: 10 },
        style: { strokeWidth: 1.5 },
        className: `flow-edge-${rel.type === 'one-to-one' ? 'oneToOne' : rel.type === 'one-to-many' ? 'many' : 'primary'}`
      });
    });
    
    return edges;
  } catch (error) {
    console.error("Error generating edges:", error);
    return [];
  }
}, [tables, tableNames, filteredRelationships, isInitialized]);
```

### Authentication Implementation

The authentication system uses industry-standard security practices:

1. **Password Hashing**: Passwords are securely hashed using scrypt with unique salts for each user
2. **Session Management**: Secure session tokens with expiration times
3. **User Validation**: Timing-safe comparison for password verification

Example password hashing:
```typescript
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}
```

## API Endpoints

### Schema API

- `GET /api/modules` - List all modules
- `GET /api/modules/:id` - Get specific module details
- `GET /api/schema` - Get complete schema information
- `GET /api/tables/:name` - Get table details
- `GET /api/search?q=query` - Search tables and columns
- `GET /api/sql/:moduleId` - Generate SQL for module
- `GET /api/sql` - Generate SQL for all modules

### Authentication API

- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user information

## Adding New Database Modules

To add new database modules to the system:

1. Define the module structure with tables and relationships
2. Add the module definition to `shared/database-schema.ts`
3. Follow the module structure pattern established in existing modules
4. Ensure all required fields are properly defined
5. Test visualization in all views (Module, ER, SQL)

## Common Challenges and Solutions

1. **React Flow Edge Rendering**: Carefully manage edge generation with unique IDs to prevent React Flow errors
2. **Node Positioning**: Use a consistent layout algorithm for node positioning
3. **Relationship Visualization**: Ensure relationship directionality is clear with properly labeled edges
4. **SQL Generation**: Follow consistent patterns for generating SQL, particularly for constraints and indexes

## Conclusion

This technical specification provides comprehensive details for understanding and extending the Database Schema Visualization Tool. Future development should adhere to these patterns to ensure consistency and maintainability.