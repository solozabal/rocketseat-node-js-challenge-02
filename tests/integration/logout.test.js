/**
 * Integration tests for Logout endpoint
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { generateEmail } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('POST /v1/logout', () => {
  let testEmail;
  let testPassword;
  let accessToken;
  let refreshToken;

  beforeAll(async () => {
    testEmail = generateEmail('logout');
    testPassword = 'Test123!@#';

    // Create user
    await request(BASE_URL)
      .post('/v1/users')
      .send({
        name: 'Logout Test User',
        email: testEmail,
        password: testPassword,
      });

    // Login to get tokens
    const loginResponse = await request(BASE_URL)
      .post('/v1/sessions')
      .send({
        email: testEmail,
        password: testPassword,
      });

    accessToken = loginResponse.body.token;
    refreshToken = loginResponse.body.refresh_token;
  });

  describe('successful logout', () => {
    it('should logout with valid access token (revoke all)', async () => {
      // First login to get fresh tokens
      const loginResponse = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: testPassword,
        });

      const token = loginResponse.body.token;
      const refresh = loginResponse.body.refresh_token;

      // Logout
      const response = await request(BASE_URL)
        .post('/v1/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(204);

      // Verify refresh token is revoked
      const refreshResponse = await request(BASE_URL)
        .post('/v1/refresh-token')
        .send({
          refresh_token: refresh,
        });

      expect(refreshResponse.status).toBe(401);
    });

    it('should logout with specific refresh token', async () => {
      // First login to get fresh tokens
      const loginResponse = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: testPassword,
        });

      const token = loginResponse.body.token;
      const refresh = loginResponse.body.refresh_token;

      // Logout with specific token
      const response = await request(BASE_URL)
        .post('/v1/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          refresh_token: refresh,
        });

      expect(response.status).toBe(204);
    });
  });

  describe('unauthorized logout', () => {
    it('should return 401 without access token', async () => {
      const response = await request(BASE_URL)
        .post('/v1/logout')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_ERROR');
    });

    it('should return 401 with invalid access token', async () => {
      const response = await request(BASE_URL)
        .post('/v1/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({});

      expect(response.status).toBe(401);
    });
  });
});
