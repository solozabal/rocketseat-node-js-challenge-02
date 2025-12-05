/**
 * Integration tests for Session endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { generateEmail, createTestUser } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('POST /v1/sessions', () => {
  let testEmail;
  let testPassword;

  beforeAll(async () => {
    testEmail = generateEmail('session');
    testPassword = 'Test123!@#';

    await request(BASE_URL)
      .post('/v1/users')
      .send({
        name: 'Session Test User',
        email: testEmail,
        password: testPassword,
      });
  });

  describe('successful login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.refresh_token).toBeDefined();
    });

    it('should return JWT tokens that are valid strings', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(typeof response.body.token).toBe('string');
      expect(response.body.token.split('.').length).toBe(3); // JWT format
    });
  });

  describe('invalid credentials', () => {
    it('should return 401 for wrong password', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_ERROR');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: 'nonexistent@test.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_ERROR');
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing email', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for missing password', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: testEmail,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(BASE_URL)
        .post('/v1/sessions')
        .send({
          email: 'not-an-email',
          password: testPassword,
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
