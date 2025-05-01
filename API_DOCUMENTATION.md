# API Documentation

## Authentication Endpoints

### User Authentication

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/register` | POST | Register a new user | `{ username, email, password, roleId }` | `{ id, username, email, roleId }` |
| `/api/login` | POST | Log in a user | `{ username, password }` | `{ id, username, email, roleId }` |
| `/api/logout` | POST | Log out the current user | None | `{ message: "Logged out successfully" }` |
| `/api/user` | GET | Get the current logged-in user | None | `{ id, username, email, roleId }` |
| `/api/users` | GET | Get all users (protected) | None | Array of user objects |
| `/api/roles` | GET | Get all available roles | None | Array of role objects |

## Schema Management Endpoints

### Module Management

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/schema` | GET | Get entire database schema | None | Complete schema object |
| `/api/modules` | GET | Get all modules | None | Array of module objects |
| `/api/modules/:id` | GET | Get a specific module by ID | None | Module object with tables |
| `/api/tables/:name` | GET | Get a specific table by name | None | Table object with columns |
| `/api/search` | GET | Search schema by query string | `{ query }` | Object with matching tables and columns |

### SQL Generation

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/sql/module/:id` | GET | Generate SQL for a specific module | None | SQL string |
| `/api/sql/all` | GET | Generate SQL for all modules | None | SQL string |

## Authentication Flow

1. **Registration**:
   - Client sends POST to `/api/register` with user details
   - Server validates data, hashes password, creates user
   - Server logs in user automatically and returns user object

2. **Login**:
   - Client sends POST to `/api/login` with credentials
   - Server validates credentials and creates session
   - Server returns user object

3. **Session Validation**:
   - Client requests protected resources
   - Server validates session through middleware
   - Returns 401 if session is invalid/expired

4. **Logout**:
   - Client sends POST to `/api/logout`
   - Server destroys session
   - Returns success message

## Response Status Codes

- `200`: Success
- `201`: Created (for registration)
- `304`: Not Modified (resource hasn't changed)
- `400`: Bad Request (invalid data)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error

## Schema Model

### User
```typescript
{
  id: number;
  username: string;
  email: string | null;
  password: string; // Hashed, never returned to client
  roleId: number | null;
  isActive: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  lastLogin: Date | null;
}
```

### Role
```typescript
{
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}
```

## Security Considerations

- Passwords are hashed using the Node.js `crypto` module with scrypt algorithm
- Sessions are managed via express-session with secure cookie settings
- Protected routes use middleware to verify authentication
- Role-based access control is implemented for certain routes