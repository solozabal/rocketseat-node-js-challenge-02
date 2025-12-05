/**
 * Meal Service
 * Business logic for meal operations
 */

const { prisma } = require('../config/database');
const { AppError } = require('../errors');
const logger = require('../config/logger');

/**
 * Default pagination values
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Create a new meal
 * @param {Object} data - Meal data
 * @param {string} data.name - Meal name
 * @param {string} [data.description] - Meal description
 * @param {string} data.datetime - Meal datetime (ISO string)
 * @param {boolean} data.is_on_diet - Whether meal is on diet
 * @param {string} userId - User ID (owner)
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Created meal
 */
const createMeal = async ({ name, description, datetime, is_on_diet }, userId, requestId) => {
  const meal = await prisma.meal.create({
    data: {
      name,
      description,
      datetime: new Date(datetime),
      is_on_diet,
      user_id: userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      datetime: true,
      is_on_diet: true,
      created_at: true,
      updated_at: true,
    },
  });

  logger.info({
    request_id: requestId,
    type: 'meal_service',
    message: 'Meal created successfully',
    mealId: meal.id,
    userId,
  });

  return meal;
};

/**
 * List meals for a user with pagination and filters
 * @param {string} userId - User ID (owner)
 * @param {Object} options - Pagination and filter options
 * @param {number} [options.page=1] - Page number
 * @param {number} [options.limit=20] - Items per page (max 100)
 * @param {string} [options.date_from] - Filter by date from (YYYY-MM-DD)
 * @param {string} [options.date_to] - Filter by date to (YYYY-MM-DD)
 * @param {boolean} [options.is_on_diet] - Filter by is_on_diet
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Paginated meals
 */
const listMeals = async (userId, { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, date_from, date_to, is_on_diet } = {}, requestId) => {
  // Ensure limit doesn't exceed max
  const safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const safePage = Math.max(1, page);
  const skip = (safePage - 1) * safeLimit;

  // Build where clause with filters
  const where = { user_id: userId };

  // Date range filter - uses index [user_id, datetime]
  if (date_from || date_to) {
    where.datetime = {};
    if (date_from) {
      // Start of day in UTC
      where.datetime.gte = new Date(`${date_from}T00:00:00.000Z`);
    }
    if (date_to) {
      // End of day in UTC
      where.datetime.lte = new Date(`${date_to}T23:59:59.999Z`);
    }
  }

  // is_on_diet filter - convert string to boolean if needed
  if (is_on_diet !== undefined && is_on_diet !== null) {
    // Handle both boolean and string values
    if (typeof is_on_diet === 'boolean') {
      where.is_on_diet = is_on_diet;
    } else if (is_on_diet === 'true') {
      where.is_on_diet = true;
    } else if (is_on_diet === 'false') {
      where.is_on_diet = false;
    }
    // If invalid value (like 'yes'), don't add to filter (ignore)
  }

  // Get meals and total count in parallel
  const [meals, total] = await Promise.all([
    prisma.meal.findMany({
      where,
      orderBy: { datetime: 'desc' },
      skip,
      take: safeLimit,
      select: {
        id: true,
        name: true,
        description: true,
        datetime: true,
        is_on_diet: true,
        created_at: true,
        updated_at: true,
      },
    }),
    prisma.meal.count({ where }),
  ]);

  const totalPages = Math.ceil(total / safeLimit);

  logger.info({
    request_id: requestId,
    type: 'meal_service',
    message: 'Meals listed',
    userId,
    page: safePage,
    limit: safeLimit,
    total,
    filters: { date_from, date_to, is_on_diet },
  });

  return {
    data: meals,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasNext: safePage < totalPages,
      hasPrev: safePage > 1,
    },
  };
};

/**
 * Get a meal by ID (with ownership check)
 * @param {string} mealId - Meal ID
 * @param {string} userId - User ID (owner)
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Meal
 * @throws {AppError} If meal not found or not owned by user
 */
const getMealById = async (mealId, userId, requestId) => {
  const meal = await prisma.meal.findUnique({
    where: { id: mealId },
    select: {
      id: true,
      name: true,
      description: true,
      datetime: true,
      is_on_diet: true,
      user_id: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!meal) {
    logger.warn({
      request_id: requestId,
      type: 'meal_service',
      message: 'Meal not found',
      mealId,
      userId,
    });
    throw AppError.notFound('Meal');
  }

  // Check ownership
  if (meal.user_id !== userId) {
    logger.warn({
      request_id: requestId,
      type: 'meal_service',
      message: 'Meal ownership check failed',
      mealId,
      userId,
      ownerId: meal.user_id,
    });
    throw AppError.notFound('Meal');
  }

  // Remove user_id from response
  const { user_id, ...mealData } = meal;

  return mealData;
};

/**
 * Update a meal (with ownership check)
 * @param {string} mealId - Meal ID
 * @param {Object} data - Update data (all fields optional)
 * @param {string} [data.name] - Meal name
 * @param {string} [data.description] - Meal description
 * @param {string} [data.datetime] - Meal datetime (ISO string)
 * @param {boolean} [data.is_on_diet] - Whether meal is on diet
 * @param {string} userId - User ID (owner)
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Updated meal
 * @throws {AppError} If meal not found or not owned by user
 */
const updateMeal = async (mealId, data, userId, requestId) => {
  // First check if meal exists and belongs to user
  await getMealById(mealId, userId, requestId);

  // Build update data (only include provided fields)
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.datetime !== undefined) updateData.datetime = new Date(data.datetime);
  if (data.is_on_diet !== undefined) updateData.is_on_diet = data.is_on_diet;

  // If no fields to update, just return current meal
  if (Object.keys(updateData).length === 0) {
    return getMealById(mealId, userId, requestId);
  }

  const meal = await prisma.meal.update({
    where: { id: mealId },
    data: updateData,
    select: {
      id: true,
      name: true,
      description: true,
      datetime: true,
      is_on_diet: true,
      created_at: true,
      updated_at: true,
    },
  });

  logger.info({
    request_id: requestId,
    type: 'meal_service',
    message: 'Meal updated successfully',
    mealId,
    userId,
    updatedFields: Object.keys(updateData),
  });

  return meal;
};

/**
 * Delete a meal (hard delete, with ownership check)
 * @param {string} mealId - Meal ID
 * @param {string} userId - User ID (owner)
 * @param {string} [requestId] - Request ID for logging
 * @throws {AppError} If meal not found or not owned by user
 */
const deleteMeal = async (mealId, userId, requestId) => {
  // First check if meal exists and belongs to user
  await getMealById(mealId, userId, requestId);

  await prisma.meal.delete({
    where: { id: mealId },
  });

  logger.info({
    request_id: requestId,
    type: 'meal_service',
    message: 'Meal deleted successfully',
    mealId,
    userId,
  });
};

module.exports = {
  createMeal,
  listMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
