# Database Schema Standards

## Table Naming Conventions

1. **Use snake_case for table and column names**
   - Example: `user_profiles`, `order_items`, `payment_methods`

2. **Use plural for table names**
   - Example: `users` instead of `user`, `orders` instead of `order`

3. **Use descriptive prefixes for related tables**
   - Example: `db_tables`, `db_columns`, `db_modules` for schema-related tables

4. **Avoid reserved SQL keywords for table and column names**
   - Example: Avoid names like `order`, `user`, `group`, `limit`

## Column Standards

1. **Primary Keys**
   - Name primary key columns `id`
   - Use auto-incrementing integers or UUIDs

2. **Foreign Keys**
   - Format: `entity_id` (e.g., `user_id`, `product_id`)
   - Always add an index to foreign key columns

3. **Timestamps**
   - Include `created_at` and `updated_at` timestamps in most tables
   - Use consistent datetime format (e.g., UTC)

4. **Soft Deletes**
   - When needed, use `deleted_at` timestamp instead of hard deletes
   - Implement consistent filtering for deleted records

5. **Boolean Fields**
   - Prefix with `is_` or `has_` (e.g., `is_active`, `has_completed`)
   - Use NOT NULL with default values

## Relationships

1. **One-to-Many**
   - Foreign key in the "many" table pointing to the "one" table's primary key
   - Example: `users` and `orders` (one user has many orders)

2. **Many-to-Many**
   - Use a junction table with both foreign keys
   - Name format: `entity1_entity2` (alphabetical order)
   - Example: `users_roles` for many-to-many between users and roles

3. **One-to-One**
   - Add foreign key to the dependent table
   - Consider using a unique constraint
   - Example: `users` and `user_profiles`

## Indexing Guidelines

1. **Index Types**
   - B-tree (default): for equality and range operations
   - Hash: for equality operations
   - GIN: for full-text search

2. **When to Index**
   - Foreign key columns
   - Columns frequently used in WHERE clauses
   - Columns used in JOIN conditions
   - Columns used in ORDER BY or GROUP BY

3. **Index Naming Convention**
   - Format: `idx_tablename_columnname(s)`
   - For multiple columns: `idx_tablename_col1_col2`

## Schema Organization

1. **Modularity**
   - Group related tables into logical modules
   - Document module responsibilities and boundaries

2. **Comments**
   - Add comments to tables and columns to explain purpose
   - Document any non-obvious constraints or validation rules

3. **Constraints**
   - Name constraints using format: `constraint_type_tablename_columnname`
   - Example: `fk_orders_user_id`, `uq_users_email`

## Data Types

1. **Text**
   - Use `varchar` with appropriate length for limited text
   - Use `text` for unlimited length text fields

2. **Numbers**
   - `integer`: general purpose integers
   - `bigint`: large integers (e.g., IDs in high-volume systems)
   - `numeric/decimal`: for exact numeric values (e.g., money)

3. **Dates and Times**
   - `timestamp with time zone`: for timestamps that need timezone awareness
   - `date`: for date-only values
   - `time`: for time-only values

4. **Boolean**
   - Use `boolean` type instead of integers (0,1) for true/false values

5. **JSON/JSONB**
   - Use `jsonb` for semi-structured data
   - Index using GIN for efficient querying

## Security Considerations

1. **Password Storage**
   - Store only hashed passwords with secure algorithms (e.g., bcrypt, Argon2)
   - Include salt with each password

2. **Personal Information**
   - Consider encryption for personally identifiable information (PII)
   - Follow data protection regulations (GDPR, CCPA, etc.)

3. **Audit Trails**
   - Use separate audit tables for tracking changes
   - Record who, what, when for sensitive operations

## Migration Practices

1. **Schema Version Control**
   - Use migration files for all schema changes
   - Never modify production schema directly

2. **Backward Compatibility**
   - Prefer additive changes over destructive ones
   - Use multi-phase migrations for breaking changes

3. **Testing**
   - Test migrations on copy of production data
   - Verify rollback procedures