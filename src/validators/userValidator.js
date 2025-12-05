/**
 * User validation schemas
 */

const { z } = require('zod');

/**
 * Schema for user registration
 */
const createUserSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format')
    .toLowerCase()
    .trim(),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(6, 'Password must be at least 6 characters'),
});

/**
 * Schema for user update (partial)
 */
const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),

  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional(),

  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
