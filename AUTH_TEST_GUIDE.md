# Authentication API Testing Guide

This guide explains how to use the `auth-test.mjs` script to test the authentication API endpoints of the PostgreSQL Database Schema Manager.

## Overview

The `auth-test.mjs` script is a Node.js utility that tests the complete authentication workflow:

1. User registration
2. User login
3. Fetching authenticated user details
4. Token refresh
5. User logout

This tool is particularly useful after:
- Setting up the application in a new environment
- Making changes to the authentication system
- Deploying in Docker or other containerized environments

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- The application running (either in development mode or in Docker)

## Configuration for Docker Deployment

If you've deployed the application using Docker as described in the [Docker Deployment Guide](./DOCKER_DEPLOYMENT.md), you'll need to update the API base URL in the `auth-test.mjs` file:

```javascript
// Change this line
const API_BASE_URL = 'http://localhost:5000';

// To match your Docker deployment
const API_BASE_URL = 'http://your-docker-host:5000';
```

Replace `your-docker-host` with the hostname or IP address where your Docker container is accessible.

## Running the Test

1. Install dependencies:
   ```bash
   npm install node-fetch
   ```

2. Run the script:
   ```bash
   node auth-test.mjs
   ```

## Expected Output

The script will output detailed information about each step in the authentication process, including:

```
=== Testing Registration ===
Status: 201 Created
Response: {
  user: { id: 123, username: 'test-user-api', email: 'test-api@example.com', ... },
  token: 'jwt_token_here',
  refreshToken: 'refresh_token_here',
  message: 'User registered successfully'
}

=== Testing Login ===
Status: 200 OK
Response: {
  user: { id: 123, username: 'test-user-api', email: 'test-api@example.com', ... },
  token: 'jwt_token_here',
  refreshToken: 'refresh_token_here'
}

=== Testing Get User ===
Status: 200 OK
Response: {
  id: 123,
  username: 'test-user-api',
  email: 'test-api@example.com',
  ...
}

=== Testing Token Refresh ===
Status: 200 OK
Response: {
  token: 'new_jwt_token_here',
  refreshToken: 'new_refresh_token_here'
}

=== Testing Logout ===
Status: 200 OK
Response: {
  message: 'Logged out successfully'
}

=== All Tests Completed Successfully ===
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   ```
   Error: connect ECONNREFUSED 127.0.0.1:5000
   ```
   - Ensure the application is running
   - Verify the port in the API_BASE_URL is correct
   - Check if Docker has mapped the ports correctly

2. **Authentication Failures**
   ```
   Status: 401 Unauthorized
   Response: { message: 'Invalid credentials' }
   ```
   - Verify the test user credentials
   - Check if the database is properly seeded
   - Ensure bcrypt or other dependencies are properly installed

3. **Request Timeout**
   ```
   Error: Request timed out
   ```
   - Check network connectivity
   - Verify the Docker network configuration
   - Ensure the server is not overloaded

### Extending the Tests

You can extend the `auth-test.mjs` script to test additional authentication features:

- Two-factor authentication (2FA) setup and verification
- Password reset functionality
- Role-based access control checks
- Audit log verification

## Integration with CI/CD

This testing script can be integrated into your Continuous Integration (CI) pipeline:

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: actions/setup-node@v2
      with:
        node-version: '20'
    - name: Install dependencies
      run: npm install
    - name: Start application
      run: npm run start:test &
    - name: Wait for application to start
      run: sleep 10
    - name: Run authentication tests
      run: node auth-test.mjs
```