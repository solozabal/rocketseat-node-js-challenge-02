/**
 * Unit tests for validators
 */

import { describe, it, expect } from 'vitest';

// Import validators
const { createUserSchema, updateUserSchema } = require('../../src/validators/userValidator');
const { createMealSchema, updateMealSchema } = require('../../src/validators/mealValidator');
const { loginSchema, refreshTokenSchema } = require('../../src/validators/sessionValidator');

describe('User Validator', () => {
  describe('createUserSchema', () => {
    it('should validate a valid user', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = createUserSchema.safeParse({
        email: 'john@example.com',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        email: 'not-an-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = createUserSchema.safeParse({
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      });
      expect(result.success).toBe(false);
    });

    it('should trim name and lowercase email', () => {
      const result = createUserSchema.safeParse({
        name: '  John Doe  ',
        email: 'JOHN@EXAMPLE.COM',
        password: '123456',
      });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john@example.com');
    });

    it('should reject short name', () => {
      const result = createUserSchema.safeParse({
        name: 'J',
        email: 'john@example.com',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateUserSchema', () => {
    it('should allow partial updates', () => {
      const result = updateUserSchema.safeParse({
        name: 'New Name',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateUserSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});

describe('Meal Validator', () => {
  describe('createMealSchema', () => {
    it('should validate a valid meal', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        description: 'Healthy lunch',
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing name', () => {
      const result = createMealSchema.safeParse({
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid datetime format', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        datetime: 'not-a-date',
        is_on_diet: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject future datetime', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        datetime: futureDate.toISOString(),
        is_on_diet: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing is_on_diet', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        datetime: '2024-01-15T12:00:00Z',
      });
      expect(result.success).toBe(false);
    });

    it('should allow optional description', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(true);
    });

    it('should allow null description', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        description: null,
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean is_on_diet', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: 'yes',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name too long', () => {
      const result = createMealSchema.safeParse({
        name: 'a'.repeat(101),
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject description too long', () => {
      const result = createMealSchema.safeParse({
        name: 'Lunch',
        description: 'a'.repeat(501),
        datetime: '2024-01-15T12:00:00Z',
        is_on_diet: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateMealSchema', () => {
    it('should allow partial updates', () => {
      const result = updateMealSchema.safeParse({
        name: 'Updated Lunch',
      });
      expect(result.success).toBe(true);
    });

    it('should allow empty object', () => {
      const result = updateMealSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should validate datetime if provided', () => {
      const result = updateMealSchema.safeParse({
        datetime: 'not-a-date',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Session Validator', () => {
  describe('loginSchema', () => {
    it('should validate valid login', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
        password: '123456',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const result = loginSchema.safeParse({
        password: '123456',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const result = loginSchema.safeParse({
        email: 'john@example.com',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'not-an-email',
        password: '123456',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refresh token request', () => {
      const result = refreshTokenSchema.safeParse({
        refresh_token: 'some-token',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing refresh_token', () => {
      const result = refreshTokenSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject empty refresh_token', () => {
      const result = refreshTokenSchema.safeParse({
        refresh_token: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
