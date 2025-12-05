/**
 * Metrics Service
 * Business logic for diet metrics and streak calculation
 */

const { prisma } = require('../config/database');
const logger = require('../config/logger');

/**
 * Calculate best streak from meals ordered by datetime asc
 * Rules:
 * - Increment streak on is_on_diet=true
 * - Reset streak on is_on_diet=false
 * - Days without meals don't break the streak
 * - On tie, return the first sequence found
 * 
 * @param {Array} meals - Meals ordered by datetime asc
 * @returns {number} Best streak count
 */
const calculateBestStreak = (meals) => {
  if (meals.length === 0) {
    return 0;
  }

  let currentStreak = 0;
  let bestStreak = 0;

  for (const meal of meals) {
    if (meal.is_on_diet) {
      currentStreak++;
      // Update best streak if current is better
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    } else {
      // Reset streak on off-diet meal
      currentStreak = 0;
    }
  }

  return bestStreak;
};

/**
 * Get diet metrics for a user
 * @param {string} userId - User ID
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Metrics object
 */
const getMetrics = async (userId, requestId) => {
  // Get all meals for the user (not soft-deleted)
  // Since we don't have soft-delete, just get all meals
  const meals = await prisma.meal.findMany({
    where: { user_id: userId },
    select: {
      id: true,
      datetime: true,
      is_on_diet: true,
    },
    orderBy: { datetime: 'asc' }, // Order by datetime for streak calculation
  });

  // Calculate totals
  const totalMeals = meals.length;
  const totalOnDiet = meals.filter((meal) => meal.is_on_diet).length;
  const totalOffDiet = meals.filter((meal) => !meal.is_on_diet).length;

  // Calculate best streak
  const bestStreak = calculateBestStreak(meals);

  logger.info({
    request_id: requestId,
    type: 'metrics_service',
    message: 'Metrics calculated',
    userId,
    totalMeals,
    totalOnDiet,
    totalOffDiet,
    bestStreak,
  });

  return {
    total_meals: totalMeals,
    total_on_diet: totalOnDiet,
    total_off_diet: totalOffDiet,
    best_streak: bestStreak,
  };
};

module.exports = {
  getMetrics,
  calculateBestStreak,
};
