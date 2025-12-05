/**
 * Meal Validation Schemas
 * Zod schemas for meal request validation
 */

const { z } = require('zod');

/**
 * Schema for creating a meal
 * All required fields except description (optional)
 */
const createMealSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  datetime: z
    .string({ required_error: 'Datetime is required' })
    .datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' }),
  is_on_diet: z.boolean({ required_error: 'is_on_diet is required' }),
});

/**
 * Schema for updating a meal
 * All fields are optional
 */
const updateMealSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .nullable(),
  datetime: z
    .string()
    .datetime({ message: 'Invalid datetime format. Use ISO 8601 format.' })
    .optional(),
  is_on_diet: z.boolean().optional(),
});

/**
 * Schema for meal ID parameter
 */
const mealIdSchema = z.object({
  id: z.string().uuid({ message: 'Invalid meal ID format' }),
});

/**
 * Schema for list query parameters
 */
const listMealsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1), {
      message: 'Page must be a positive integer',
    }),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1 && val <= 100), {
      message: 'Limit must be between 1 and 100',
    }),
});

module.exports = {
  createMealSchema,
  updateMealSchema,
  mealIdSchema,
  listMealsQuerySchema,
};
