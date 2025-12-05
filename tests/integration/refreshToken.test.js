/**
 * Integration tests for Refresh Token endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { generateEmail } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('POST /v1/refresh-token', () => {
  let testEmail;
  let testPassword;
  let refreshToken;

  beforeAll(async () => {
    testEmail = generateEmail('refresh');
    testPassword = 'Test123!@#';

    // Create user
    await request(BASE_URL)
      .post('/v1/users')
      .send({
        name: 'Refresh Test User',
        email: testEmail,
        password: testPassword,
      });

    // Login to get refresh token
    const loginResponse = await request(BASE_URL)
      .post('/v1/sessions')
      .send({
        email: testEmail,
        password: testPassword,
      });

    refreshToken = loginResponse.body.refresh_token;
  });

  describe('successful token refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const response = await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({
          refresh_token: refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
      // New refresh token should be different (rotation)
      expect(response.body.refresh_token).not.toBe(refreshToken);

      // Update refresh token for next test
      refreshToken = response.body.refresh_token;
    });
  });

  describe('invalid refresh token', () => {
    it('should return 401 for invalid refresh token', async () => {
      const response = await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({
          refresh_token: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_ERROR');
    });

    it('should return 401 for already used refresh token', async () => {
      // First, get a new token
      const loginResponse = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: testPassword,
        });

      const oldToken = loginResponse.body.refresh_token;

      // Use it once
      await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({
          refresh_token: oldToken,
        });

      // Try to use it again - should fail (token rotation)
      const response = await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({
          refresh_token: oldToken,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing refresh_token', async () => {
      const response = await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
