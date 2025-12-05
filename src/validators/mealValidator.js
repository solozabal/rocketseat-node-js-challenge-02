/**
 * Meal validation schemas
 */

const { z } = require('zod');

/**
 * Custom validation for datetime (ISO format, not in future)
 */
const datetimeSchema = z
  .string({
    required_error: 'Datetime is required',
    invalid_type_error: 'Datetime must be a string',
  })
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid datetime format. Use ISO 8601 format (e.g., 2024-01-15T12:00:00Z)' }
  )
  .refine(
    (val) => {
      const date = new Date(val);
      const now = new Date();
      return date <= now;
    },
    { message: 'Datetime cannot be in the future' }
  );

/**
 * Schema for meal creation
 */
const createMealSchema = z.object({
  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),

  description: z
    .string({
      invalid_type_error: 'Description must be a string',
    })
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),

  datetime: datetimeSchema,

  is_on_diet: z.boolean({
    required_error: 'is_on_diet is required',
    invalid_type_error: 'is_on_diet must be a boolean',
  }),
});

/**
 * Schema for meal update (partial)
 */
const updateMealSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),

  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .nullable(),

  datetime: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'Invalid datetime format. Use ISO 8601 format' }
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const now = new Date();
        return date <= now;
      },
      { message: 'Datetime cannot be in the future' }
    )
    .optional(),

  is_on_diet: z
    .boolean({
      invalid_type_error: 'is_on_diet must be a boolean',
    })
    .optional(),
});

module.exports = {
  createMealSchema,
  updateMealSchema,
};
