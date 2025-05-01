# API Documentation

## Authentication API

This document provides comprehensive information about the authentication API endpoints, request/response formats, and authentication flows for the PostgreSQL Database Schema Manager.

## Table of Contents
- [Authentication Endpoints](#authentication-endpoints)
  - [Registration](#registration)
  - [Login](#login)
  - [Token Refresh](#token-refresh)
  - [Logout](#logout)
  - [Current User](#current-user)
  - [Password Reset](#password-reset)
  - [Two-Factor Authentication](#two-factor-authentication)
- [Authentication Headers](#authentication-headers)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

## Authentication Endpoints

### Registration

Register a new user account.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "ComplexP@ssw0rd",
  "mobile_number": "+1234567890",  // Optional
  "role": "user"                   // Optional (defaults to "user")
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

**Response (201 Created)**:
```json
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "message": "User registered successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid input data, username/email already exists
- `500 Internal Server Error`: Server-side processing error

### Login

Authenticate and receive access tokens.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:
```json
{
  "email": "john.doe@example.com",
  "password": "ComplexP@ssw0rd"
}
```

**Response (200 OK)**:
```json
{
  "user": {
    "id": 123,
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "message": "Login successful"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account locked or inactive
- `500 Internal Server Error`: Server-side processing error

### Token Refresh

Obtain a new access token using a refresh token.

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK)**:
```json
{
  "token": "new_jwt_token_here",
  "refreshToken": "new_refresh_token_here"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token
- `500 Internal Server Error`: Server-side processing error

### Logout

Invalidate the current session.

- **URL**: `/auth/logout`
- **Method**: `POST`
- **Auth Required**: Yes (JWT)

**Headers**:
```
Authorization: Bearer jwt_token_here
```

**Response (200 OK)**:
```json
{
  "message": "Logged out successfully"
}
```

**Error Responses**:
- `401 Unauthorized`: No token provided, invalid or expired token
- `500 Internal Server Error`: Server-side processing error

### Current User

Get current authenticated user information.

- **URL**: `/auth/user`
- **Method**: `GET`
- **Auth Required**: Yes (JWT)

**Headers**:
```
Authorization: Bearer jwt_token_here
```

**Response (200 OK)**:
```json
{
  "id": 123,
  "username": "johndoe",
  "email": "john.doe@example.com",
  "role": "user"
}
```

**Error Responses**:
- `401 Unauthorized`: No token provided, invalid or expired token
- `500 Internal Server Error`: Server-side processing error

### Password Reset

#### Request Reset

- **URL**: `/auth/password-reset/request`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200 OK)**:
```json
{
  "message": "If the email exists, a reset link has been sent"
}
```

#### Confirm Reset

- **URL**: `/auth/password-reset/confirm`
- **Method**: `POST`
- **Auth Required**: No

**Request Body**:
```json
{
  "token": "reset_token_here",
  "password": "NewComplexP@ssw0rd"
}
```

**Response (200 OK)**:
```json
{
  "message": "Password has been reset successfully"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid token, token expired, or password too weak
- `500 Internal Server Error`: Server-side processing error

### Two-Factor Authentication

#### Setup 2FA

- **URL**: `/auth/2fa/setup`
- **Method**: `POST`
- **Auth Required**: Yes (JWT)

**Headers**:
```
Authorization: Bearer jwt_token_here
```

**Response (200 OK)**:
```json
{
  "message": "2FA setup initiated",
  "secret": "totp_secret_here",
  "isEnabled": false
}
```

#### Verify and Enable 2FA

- **URL**: `/auth/2fa/verify`
- **Method**: `POST`
- **Auth Required**: Yes (JWT)

**Headers**:
```
Authorization: Bearer jwt_token_here
```

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "message": "2FA successfully enabled",
  "isEnabled": true
}
```

#### Disable 2FA

- **URL**: `/auth/2fa/disable`
- **Method**: `POST`
- **Auth Required**: Yes (JWT)

**Headers**:
```
Authorization: Bearer jwt_token_here
```

**Request Body**:
```json
{
  "code": "123456"
}
```

**Response (200 OK)**:
```json
{
  "message": "2FA successfully disabled",
  "isEnabled": false
}
```

**Error Responses**:
- `400 Bad Request`: Invalid or missing verification code
- `401 Unauthorized`: No token provided, invalid or expired token
- `500 Internal Server Error`: Server-side processing error

## Authentication Headers

For protected endpoints, include the JWT token in the Authorization header:

```
Authorization: Bearer jwt_token_here
```

## Error Handling

All API endpoints return standardized error responses:

```json
{
  "message": "Human-readable error message",
  "errors": {
    "field1": "Error description for field1",
    "field2": "Error description for field2"
  }
}
```

## Data Models

### User
```typescript
{
  id: number;          // Unique identifier
  username: string;    // Unique username
  email: string;       // Unique email address
  password: string;    // Securely hashed password (never returned in API responses)
  mobile_number?: string; // Optional mobile number
  role: string;        // User role: "admin", "user", etc.
  is_active: boolean;  // Account active status
  created_at: Date;    // Account creation timestamp
  updated_at: Date;    // Last update timestamp
}
```

### Session
```typescript
{
  id: number;          // Session identifier
  user_id: number;     // Associated user
  token: string;       // JWT token (hashed)
  refresh_token: string; // Refresh token (hashed)
  ip_address: string;  // Client IP address
  user_agent: string;  // Client user agent
  expires_at: Date;    // Expiration timestamp
  created_at: Date;    // Creation timestamp
}
```

### Two-Factor Authentication
```typescript
{
  id: number;          // Record identifier
  user_id: number;     // Associated user
  totp_secret: string; // TOTP secret key
  is_enabled: boolean; // Whether 2FA is enabled
  created_at: Date;    // Creation timestamp
  updated_at: Date;    // Last update timestamp
}
```

### Password Reset
```typescript
{
  id: number;          // Record identifier
  user_id: number;     // Associated user
  token: string;       // Reset token
  expires_at: Date;    // Expiration timestamp
  used_at: Date;       // When token was used (null if unused)
  created_at: Date;    // Creation timestamp
}
```

### Audit Log
```typescript
{
  id: number;          // Record identifier
  user_id: number;     // Associated user (can be null)
  event_type: string;  // Type of event (LOGIN, LOGOUT, etc.)
  ip_address: string;  // Client IP address
  user_agent: string;  // Client user agent
  event_details: object; // Additional event details
  resource_type: string; // Type of resource affected
  resource_id: string; // Identifier of affected resource
  status: string;      // Outcome (SUCCESS, FAILED, ERROR)
  created_at: Date;    // Timestamp of the event
}
```