/**
 * Validation Schemas
 * Centralized export of all Zod schemas
 */

const {
  createMealSchema,
  updateMealSchema,
  mealIdSchema,
  listMealsQuerySchema,
} = require('./mealSchemas');

module.exports = {
  // Meal schemas
  createMealSchema,
  updateMealSchema,
  mealIdSchema,
  listMealsQuerySchema,
};
