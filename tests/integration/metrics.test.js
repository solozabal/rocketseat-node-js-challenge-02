/**
 * Integration tests for Metrics endpoint
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { generateEmail } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('GET /v1/metrics', () => {
  let accessToken;
  const createdMealIds = [];

  beforeAll(async () => {
    const email = generateEmail('metrics');
    const password = 'Test123!@#';

    // Create user
    await request(BASE_URL)
      .post('/v1/users')
      .send({
        name: 'Metrics Test User',
        email,
        password,
      });

    // Login
    const loginResponse = await request(BASE_URL)
      .post('/v1/sessions')
      .send({ email, password });

    accessToken = loginResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup meals
    for (const id of createdMealIds) {
      await request(BASE_URL)
        .delete(`/v1/meals/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }
  });

  describe('no meals', () => {
    it('should return all zeros when no meals exist', async () => {
      // Create a new user with no meals
      const email = generateEmail('metrics-empty');
      const password = 'Test123!@#';

      await request(BASE_URL)
        .post('/v1/users')
        .send({
          name: 'Empty Metrics User',
          email,
          password,
        });

      const loginResponse = await request(BASE_URL)
        .post('/v1/sessions')
        .send({ email, password });

      const token = loginResponse.body.token;

      const response = await request(BASE_URL)
        .get('/v1/metrics')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.total_meals).toBe(0);
      expect(response.body.total_on_diet).toBe(0);
      expect(response.body.total_off_diet).toBe(0);
      expect(response.body.best_streak).toBe(0);
    });
  });

  describe('with meals', () => {
    it('should calculate metrics correctly', async () => {
      // Create test meals
      const meals = [
        { name: 'Meal 1', datetime: '2025-12-01T08:00:00Z', is_on_diet: true },
        { name: 'Meal 2', datetime: '2025-12-01T12:00:00Z', is_on_diet: true },
        { name: 'Meal 3', datetime: '2025-12-01T18:00:00Z', is_on_diet: false },
        { name: 'Meal 4', datetime: '2025-12-02T08:00:00Z', is_on_diet: true },
      ];

      for (const meal of meals) {
        const response = await request(BASE_URL)
          .post('/v1/meals')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(meal);

        if (response.body.meal?.id) {
          createdMealIds.push(response.body.meal.id);
        }
      }

      const response = await request(BASE_URL)
        .get('/v1/metrics')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total_meals).toBe(4);
      expect(response.body.total_on_diet).toBe(3);
      expect(response.body.total_off_diet).toBe(1);
      expect(response.body.best_streak).toBe(2); // First 2 on-diet meals
    });
  });

  describe('authentication', () => {
    it('should return 401 without access token', async () => {
      const response = await request(BASE_URL).get('/v1/metrics');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTH_ERROR');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(BASE_URL)
        .get('/v1/metrics')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('response format', () => {
    it('should return proper structure', async () => {
      const response = await request(BASE_URL)
        .get('/v1/metrics')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(typeof response.body.total_meals).toBe('number');
      expect(typeof response.body.total_on_diet).toBe('number');
      expect(typeof response.body.total_off_diet).toBe('number');
      expect(typeof response.body.best_streak).toBe('number');
    });
  });
});
