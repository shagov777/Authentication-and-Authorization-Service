# Database Schema Standards

## Overview

This document outlines the standards and best practices for designing database modules within our PostgreSQL application. Following these guidelines ensures consistent, maintainable, and efficient database schemas across all application modules.

## Module Structure

### Module Definition

Each functional area of the application should be organized as a module with:

```typescript
type DbModule = {
  name: string;        // Unique, descriptive name
  description: string; // Detailed explanation of module purpose
  tables: DbTable[];   // Collection of related tables
};
```

### Example Modules

The application is divided into logical modules such as:

- Authentication & Authorization
- Profile Management
- Wallet & Transactions
- Security
- Customer Support
- Bonus System
- Reporting & Analytics
- Loyalty / VIP

## Table Design Standards

### Naming Conventions

- Use `snake_case` for all database objects (tables, columns, indexes, constraints)
- Use plural nouns for table names (e.g., `users`, `profiles`, `transactions`)
- Prefix tables with module identifier for clarity when needed (e.g., `auth_sessions`, `wallet_transactions`)
- Be descriptive but concise with names

### Table Structure

Each table should include:

```typescript
type DbTable = {
  name: string;               // Table name
  description: string;        // Purpose of the table
  columns: DbColumn[];        // Column definitions
  indexes?: DbIndex[];        // Index definitions
  constraints?: string[];     // Additional constraints
};
```

### Required Fields

All tables should generally include:

- Primary key (typically `id` as a serial/integer)
- Creation timestamp (`created_at`)
- Update timestamp (`updated_at`) where appropriate
- Appropriate foreign keys for relationships
- Soft delete flag if entity should support soft deletion

## Column Design Standards

### Column Definition

```typescript
type DbColumn = {
  name: string;           // Column name
  type: string;           // PostgreSQL data type
  description?: string;   // Purpose of the column
  isPrimaryKey?: boolean; // Is this a primary key?
  isForeignKey?: boolean; // Is this a foreign key?
  isNotNull?: boolean;    // Does this column require a value?
  isUnique?: boolean;     // Must this column be unique?
  defaultValue?: string;  // Default value if any
  references?: {          // For foreign keys
    table: string;
    column: string;
  };
};
```

### Data Types

Use appropriate PostgreSQL data types:

- `serial` for auto-incrementing primary keys
- `integer` for whole numbers
- `decimal` for precise numeric values (especially money)
- `text` for variable-length strings
- `varchar(n)` when length limit is required
- `timestamp` for date/time values
- `boolean` for true/false values
- `jsonb` for structured JSON data
- `uuid` for universally unique identifiers

### Common Column Patterns

- **ID Columns**: `id serial PRIMARY KEY`
- **Foreign Keys**: `{table_name}_id integer REFERENCES {table_name}(id)`
- **Timestamps**: `created_at timestamp DEFAULT NOW()`, `updated_at timestamp DEFAULT NOW()`
- **Soft Delete**: `deleted_at timestamp NULL`
- **Status Fields**: `status text CHECK (status IN ('active', 'pending', 'inactive'))`

## Relationship Standards

### Relationship Types

```typescript
type DbRelationship = {
  source: string;       // Source table name
  target: string;       // Target table name
  sourceField?: string; // Source field (optional)
  targetField?: string; // Target field (optional)
  label: string;        // Relationship description
  type: "one-to-one" | "one-to-many" | "many-to-many"; // Relationship type
};
```

### Implementation Patterns

#### One-to-One
- Add a unique foreign key in one table referencing the other
- Example: `user_id integer UNIQUE REFERENCES users(id)`

#### One-to-Many
- Add a foreign key in the "many" table pointing to the "one" table
- Example: `user_id integer REFERENCES users(id)`

#### Many-to-Many
- Create a junction table with foreign keys to both related tables
- Include a composite primary key or unique constraint on both foreign keys
- Example: `user_role` table with `user_id` and `role_id` columns

## Indexing Standards

### Index Definition

```typescript
type DbIndex = {
  name: string;      // Index name
  columns: string[]; // Columns to index
  unique?: boolean;  // Is this a unique index?
};
```

### Indexing Guidelines

- Always index foreign key columns
- Create indexes on columns frequently used in WHERE clauses
- Add unique indexes/constraints where appropriate
- Consider composite indexes for queries involving multiple columns
- Follow naming pattern: `idx_{table}_{column(s)}`

## Constraint Standards

### Common Constraints

- Primary Key: `PRIMARY KEY (id)`
- Foreign Key: `FOREIGN KEY (user_id) REFERENCES users(id)`
- Unique: `UNIQUE (email)`
- Check: `CHECK (status IN ('active', 'inactive'))`
- Not Null: `NOT NULL`
- Default: `DEFAULT NOW()`

### Naming Patterns

- Primary Key: `pk_{table}`
- Foreign Key: `fk_{table}_{column}_{ref_table}`
- Unique: `uq_{table}_{column(s)}`
- Check: `chk_{table}_{column}_{rule}`

## Module-Specific Standards

### Authentication & Authorization

Tables should include:
- `users` with secure password storage
- `roles` for role definitions
- `user_roles` for role assignments
- `sessions` for session management
- `permissions` for granular access control

### Profile Management

Tables should include:
- `profiles` for user profile information
- `profile_settings` for user preferences
- `addresses` for user address information
- `documents` for user document uploads

### Wallet & Transactions

Tables should include:
- `wallets` for user balances
- `transactions` for financial operations
- `transaction_types` for categorizing transactions
- `payment_methods` for payment options

## SQL Generation Standards

Generated SQL should follow these formatting rules:

```sql
CREATE TABLE table_name (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at timestamp NOT NULL DEFAULT NOW(),
  updated_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_table_name_status ON table_name(status);

ALTER TABLE table_name 
  ADD CONSTRAINT fk_table_name_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id);
```

## Example Module Implementation

### Example: Customer Support Module

```typescript
const customerSupportModule: DbModule = {
  name: "Customer Support",
  description: "Tables for managing customer support tickets and interactions",
  tables: [
    {
      name: "support_tickets",
      description: "Customer support requests and issues",
      columns: [
        { name: "id", type: "serial", isPrimaryKey: true },
        { name: "user_id", type: "integer", isNotNull: true, isForeignKey: true, references: { table: "users", column: "id" } },
        { name: "subject", type: "text", isNotNull: true },
        { name: "description", type: "text", isNotNull: true },
        { name: "status", type: "text", isNotNull: true, defaultValue: "'open'" },
        { name: "priority", type: "text", isNotNull: true, defaultValue: "'medium'" },
        { name: "category_id", type: "integer", isNotNull: true, isForeignKey: true, references: { table: "support_categories", column: "id" } },
        { name: "assigned_agent_id", type: "integer", isForeignKey: true, references: { table: "support_agents", column: "id" } },
        { name: "created_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" },
        { name: "updated_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" },
        { name: "resolved_at", type: "timestamp" }
      ],
      indexes: [
        { name: "idx_support_tickets_user_id", columns: ["user_id"] },
        { name: "idx_support_tickets_status", columns: ["status"] },
        { name: "idx_support_tickets_category_id", columns: ["category_id"] },
        { name: "idx_support_tickets_assigned_agent_id", columns: ["assigned_agent_id"] }
      ],
      constraints: [
        "CHECK (status IN ('open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'))",
        "CHECK (priority IN ('low', 'medium', 'high', 'urgent'))"
      ]
    },
    {
      name: "support_categories",
      description: "Categories for support tickets",
      columns: [
        { name: "id", type: "serial", isPrimaryKey: true },
        { name: "name", type: "text", isNotNull: true, isUnique: true },
        { name: "description", type: "text" },
        { name: "is_active", type: "boolean", isNotNull: true, defaultValue: "true" },
        { name: "created_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" },
        { name: "updated_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" }
      ],
      indexes: [
        { name: "idx_support_categories_is_active", columns: ["is_active"] }
      ]
    },
    {
      name: "support_messages",
      description: "Messages within support tickets",
      columns: [
        { name: "id", type: "serial", isPrimaryKey: true },
        { name: "ticket_id", type: "integer", isNotNull: true, isForeignKey: true, references: { table: "support_tickets", column: "id" } },
        { name: "sender_type", type: "text", isNotNull: true },
        { name: "sender_id", type: "integer", isNotNull: true },
        { name: "message", type: "text", isNotNull: true },
        { name: "attachments", type: "jsonb" },
        { name: "created_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" },
        { name: "is_internal", type: "boolean", isNotNull: true, defaultValue: "false" }
      ],
      indexes: [
        { name: "idx_support_messages_ticket_id", columns: ["ticket_id"] },
        { name: "idx_support_messages_sender", columns: ["sender_type", "sender_id"] }
      ],
      constraints: [
        "CHECK (sender_type IN ('user', 'agent', 'system'))"
      ]
    },
    {
      name: "support_agents",
      description: "Support staff members",
      columns: [
        { name: "id", type: "serial", isPrimaryKey: true },
        { name: "user_id", type: "integer", isNotNull: true, isForeignKey: true, references: { table: "users", column: "id" } },
        { name: "is_active", type: "boolean", isNotNull: true, defaultValue: "true" },
        { name: "specialization", type: "text" },
        { name: "max_tickets", type: "integer", defaultValue: "20" },
        { name: "created_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" },
        { name: "updated_at", type: "timestamp", isNotNull: true, defaultValue: "NOW()" }
      ],
      indexes: [
        { name: "idx_support_agents_user_id", columns: ["user_id"], unique: true },
        { name: "idx_support_agents_is_active", columns: ["is_active"] }
      ]
    }
  ]
};
```

## Conclusion

Following these database schema standards ensures:

1. Consistency across all application modules
2. Improved maintainability of the database
3. Efficient database performance
4. Clear documentation of the data model
5. Easier onboarding for new developers

When implementing new modules, reference this document and the existing modules as examples to maintain consistency throughout the application.