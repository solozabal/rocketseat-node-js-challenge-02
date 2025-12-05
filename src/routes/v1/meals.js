/**
 * Meals Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const { mealController } = require('../../controllers');
const { validateBody, validateParams, validateQuery } = require('../../middlewares');
const {
  createMealSchema,
  updateMealSchema,
  mealIdSchema,
  listMealsQuerySchema,
} = require('../../schemas');

const router = express.Router();

/**
 * GET /v1/meals
 * List all meals for authenticated user (with pagination)
 */
router.get('/', validateQuery(listMealsQuerySchema), mealController.list);

/**
 * POST /v1/meals
 * Create a new meal
 */
router.post('/', validateBody(createMealSchema), mealController.create);

/**
 * GET /v1/meals/:id
 * Get a meal by ID
 */
router.get('/:id', validateParams(mealIdSchema), mealController.getById);

/**
 * PUT /v1/meals/:id
 * Update a meal
 */
router.put(
  '/:id',
  validateParams(mealIdSchema),
  validateBody(updateMealSchema),
  mealController.update
);

/**
 * DELETE /v1/meals/:id
 * Delete a meal
 */
router.delete('/:id', validateParams(mealIdSchema), mealController.remove);

module.exports = router;
