/**
 * Integration tests for Meals endpoints
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { generateEmail } from './helpers.js';

const BASE_URL = 'http://localhost:3000';

describe('Meals endpoints', () => {
  let accessToken;
  let createdMealId;

  beforeAll(async () => {
    const email = generateEmail('meals');
    const password = 'Test123!@#';

    // Create user
    await request(BASE_URL)
      .post('/v1/users')
      .send({
        name: 'Meals Test User',
        email,
        password,
      });

    // Login
    const loginResponse = await request(BASE_URL)
      .post('/v1/sessions')
      .send({ email, password });

    accessToken = loginResponse.body.token;
  });

  describe('POST /v1/meals', () => {
    it('should create a meal with valid data', async () => {
      const response = await request(BASE_URL)
        .post('/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Breakfast',
          description: 'Eggs and toast',
          datetime: '2025-12-05T08:00:00Z',
          is_on_diet: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Meal created successfully');
      expect(response.body.meal).toBeDefined();
      expect(response.body.meal.name).toBe('Test Breakfast');
      expect(response.body.meal.is_on_diet).toBe(true);

      createdMealId = response.body.meal.id;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(BASE_URL)
        .post('/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Missing name and datetime',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(BASE_URL)
        .post('/v1/meals')
        .send({
          name: 'Test Meal',
          datetime: '2025-12-05T08:00:00Z',
          is_on_diet: true,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/meals', () => {
    it('should list meals with pagination', async () => {
      const response = await request(BASE_URL)
        .get('/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by is_on_diet', async () => {
      const response = await request(BASE_URL)
        .get('/v1/meals?is_on_diet=true')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      response.body.data.forEach((meal) => {
        expect(meal.is_on_diet).toBe(true);
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(BASE_URL).get('/v1/meals');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /v1/meals/:id', () => {
    it('should get a meal by id', async () => {
      const response = await request(BASE_URL)
        .get(`/v1/meals/${createdMealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meal).toBeDefined();
      expect(response.body.meal.id).toBe(createdMealId);
    });

    it('should return 404 for non-existent meal', async () => {
      const response = await request(BASE_URL)
        .get('/v1/meals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await request(BASE_URL)
        .get('/v1/meals/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /v1/meals/:id', () => {
    it('should update a meal', async () => {
      const response = await request(BASE_URL)
        .put(`/v1/meals/${createdMealId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Breakfast',
          is_on_diet: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.meal.name).toBe('Updated Breakfast');
      expect(response.body.meal.is_on_diet).toBe(false);
    });

    it('should return 404 for non-existent meal', async () => {
      const response = await request(BASE_URL)
        .put('/v1/meals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /v1/meals/:id', () => {
    it('should delete a meal', async () => {
      // First create a meal to delete
      const createResponse = await request(BASE_URL)
        .post('/v1/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Meal to Delete',
          datetime: '2025-12-05T12:00:00Z',
          is_on_diet: true,
        });

      const mealId = createResponse.body.meal.id;

      // Delete it
      const response = await request(BASE_URL)
        .delete(`/v1/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(BASE_URL)
        .get(`/v1/meals/${mealId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent meal', async () => {
      const response = await request(BASE_URL)
        .delete('/v1/meals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(404);
    });
  });
});
