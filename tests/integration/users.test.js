/**
 * Integration tests for User endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { generateEmail } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('POST /v1/users', () => {
  describe('successful registration', () => {
    it('should create a new user with valid data', async () => {
      const email = generateEmail('user');
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Test User',
          email,
          password: 'Test123!@#',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.name).toBe('Test User');
      expect(response.body.user.password).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing name', async () => {
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          email: generateEmail(),
          password: 'Test123!@#',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'Test123!@#',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for short password (less than 6 chars)', async () => {
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Test User',
          email: generateEmail(),
          password: 'T1!a',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('duplicate email', () => {
    let existingEmail;

    beforeAll(async () => {
      existingEmail = generateEmail('existing');
      await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Existing User',
          email: existingEmail,
          password: 'Test123!@#',
        });
    });

    it('should return 409 for duplicate email', async () => {
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Another User',
          email: existingEmail,
          password: 'Test123!@#',
        });

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });
  });

  describe('response format', () => {
    it('should include request_id in error response', async () => {
      const response = await request(BASE_URL)
        .post('/v1/users')
        .send({
          email: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.request_id).toBeDefined();
    });
  });
});
