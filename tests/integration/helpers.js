/**
 * Integration Test Helpers
 * Common utilities for integration tests
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3000';

/**
 * Generate a unique email for testing
 */
export const generateEmail = (prefix = 'test') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
};

/**
 * Create a test user and return credentials
 */
export const createTestUser = async () => {
  const email = generateEmail('integration');
  const password = 'Test123!@#';
  const name = 'Integration Test User';

  const response = await request(BASE_URL)
    .post('/v1/users')
    .send({ name, email, password });

  return { email, password, name, userId: response.body.user?.id };
};

/**
 * Login and return tokens
 */
export const login = async (email, password) => {
  const response = await request(BASE_URL)
    .post('/v1/sessions')
    .send({ email, password });

  return {
    token: response.body.token,
    refreshToken: response.body.refresh_token,
    user: response.body.user,
  };
};

/**
 * Create a test user and login, returning all credentials
 */
export const createAndLoginUser = async () => {
  const { email, password, name } = await createTestUser();
  const { token, refreshToken, user } = await login(email, password);

  return {
    email,
    password,
    name,
    token,
    refreshToken,
    user,
  };
};

/**
 * Generate a mock JWT token for testing
 */
export const generateMockToken = (payload = {}, options = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@test.com',
    ...payload,
  };

  return jwt.sign(
    defaultPayload,
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing',
    { expiresIn: options.expiresIn || '15m' }
  );
};

/**
 * Generate an expired token for testing
 */
export const generateExpiredToken = (payload = {}) => {
  return generateMockToken(payload, { expiresIn: '-1s' });
};

/**
 * Create authenticated request helper
 */
export const authRequest = (token) => {
  return {
    get: (url) => request(BASE_URL).get(url).set('Authorization', `Bearer ${token}`),
    post: (url) => request(BASE_URL).post(url).set('Authorization', `Bearer ${token}`),
    put: (url) => request(BASE_URL).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url) => request(BASE_URL).delete(url).set('Authorization', `Bearer ${token}`),
  };
};

export default {
  BASE_URL,
  generateEmail,
  createTestUser,
  login,
  createAndLoginUser,
  generateMockToken,
  generateExpiredToken,
  authRequest,
};
