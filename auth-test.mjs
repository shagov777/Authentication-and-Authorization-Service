/**
 * Authentication API Test Script
 * 
 * Run this script with Node.js to test the authentication API
 * Example: node auth-test.mjs
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5000';

// Test user data
const testUser = {
  email: 'test-api@example.com',
  username: 'test-user-api',
  password: 'Test@123456',
  mobile_number: '1234567890',
  role: 'user'
};

// Store tokens
let authToken = '';
let refreshToken = '';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  };

  try {
    console.log(`${method} ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const responseData = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    console.log('-'.repeat(50));
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error('Error:', error.message);
    return { status: 500, data: { message: error.message } };
  }
}

// Test functions
async function testRegister() {
  console.log('TESTING USER REGISTRATION');
  return apiRequest('/auth/register', 'POST', testUser);
}

async function testLogin() {
  console.log('TESTING USER LOGIN');
  const response = await apiRequest('/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (response.status === 200) {
    authToken = response.data.token;
    refreshToken = response.data.refreshToken;
    console.log('Authentication successful!');
    console.log(`Token: ${authToken.substring(0, 20)}...`);
    console.log(`Refresh Token: ${refreshToken.substring(0, 20)}...`);
  }
  
  return response;
}

async function testGetUser() {
  console.log('TESTING GET USER PROFILE');
  console.log(`Using auth token: ${authToken.substring(0, 25)}...`);
  console.log(`Authorization header: Bearer ${authToken.substring(0, 20)}...`);
  return apiRequest('/auth/user', 'GET', null, authToken);
}

async function testRefreshToken() {
  console.log('TESTING TOKEN REFRESH');
  const response = await apiRequest('/auth/refresh', 'POST', { refreshToken });
  
  if (response.status === 200) {
    authToken = response.data.token;
    refreshToken = response.data.refreshToken;
    console.log('Token refresh successful!');
    console.log(`New Token: ${authToken.substring(0, 20)}...`);
  }
  
  return response;
}

async function testLogout() {
  console.log('TESTING LOGOUT');
  return apiRequest('/auth/logout', 'POST', null, authToken);
}

// Run all tests
async function runTests() {
  try {
    console.log('STARTING API TESTS');
    console.log('='.repeat(50));
    
    // Try to register (may fail if user already exists)
    const registerResult = await testRegister();
    
    // Login
    const loginResult = await testLogin();
    if (loginResult.status !== 200) {
      console.log('Login failed, cannot continue tests');
      return;
    }
    
    // Get user profile
    await testGetUser();
    
    // Refresh token
    await testRefreshToken();
    
    // Test with new token
    await testGetUser();
    
    // Logout
    await testLogout();
    
    console.log('TEST SUITE COMPLETED');
  } catch (error) {
    console.error('Test suite error:', error);
  }
}

// Run the tests
runTests();