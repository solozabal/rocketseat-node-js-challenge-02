/**
 * Session/Auth validation schemas
 */

const { z } = require('zod');

/**
 * Schema for login (create session)
 */
const loginSchema = z.object({
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
    .min(1, 'Password is required'),
});

/**
 * Schema for refresh token
 */
const refreshTokenSchema = z.object({
  refresh_token: z
    .string({
      required_error: 'Refresh token is required',
      invalid_type_error: 'Refresh token must be a string',
    })
    .min(1, 'Refresh token is required'),
});

module.exports = {
  loginSchema,
  refreshTokenSchema,
};
