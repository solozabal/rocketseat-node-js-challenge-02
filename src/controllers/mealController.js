/**
 * Meal Controller
 * HTTP request handlers for meal operations
 */

const { mealService } = require('../services');
const logger = require('../config/logger');

/**
 * Create a new meal
 * POST /v1/meals
 */
const create = async (req, res, next) => {
  try {
    const { name, description, datetime, is_on_diet } = req.body;
    const userId = req.user.id;

    logger.info({
      request_id: req.id,
      type: 'meal_controller',
      message: 'Creating new meal',
      userId,
    });

    const meal = await mealService.createMeal(
      { name, description, datetime, is_on_diet },
      userId,
      req.id
    );

    res.status(201).json({
      message: 'Meal created successfully',
      meal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all meals for authenticated user
 * GET /v1/meals
 */
const list = async (req, res, next) => {
  try {
    const userId = req.user.id;
    // Values are already validated and transformed by the middleware
    const { page, limit, date_from, date_to, is_on_diet } = req.query;

    logger.info({
      request_id: req.id,
      type: 'meal_controller',
      message: 'Listing meals',
      userId,
      page,
      limit,
      date_from,
      date_to,
      is_on_diet,
    });

    const result = await mealService.listMeals(
      userId,
      {
        page,
        limit,
        date_from,
        date_to,
        is_on_diet,
      },
      req.id
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a meal by ID
 * GET /v1/meals/:id
 */
const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info({
      request_id: req.id,
      type: 'meal_controller',
      message: 'Getting meal by ID',
      mealId: id,
      userId,
    });

    const meal = await mealService.getMealById(id, userId, req.id);

    res.json({ meal });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a meal
 * PUT /v1/meals/:id
 */
const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, datetime, is_on_diet } = req.body;
    const userId = req.user.id;

    logger.info({
      request_id: req.id,
      type: 'meal_controller',
      message: 'Updating meal',
      mealId: id,
      userId,
    });

    const meal = await mealService.updateMeal(
      id,
      { name, description, datetime, is_on_diet },
      userId,
      req.id
    );

    res.json({
      message: 'Meal updated successfully',
      meal,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a meal
 * DELETE /v1/meals/:id
 */
const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    logger.info({
      request_id: req.id,
      type: 'meal_controller',
      message: 'Deleting meal',
      mealId: id,
      userId,
    });

    await mealService.deleteMeal(id, userId, req.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
};
