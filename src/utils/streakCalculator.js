/**
 * Streak Calculator
 * Pure function for calculating diet streaks
 */

/**
 * Calculate best streak from meals ordered by datetime asc
 * Rules:
 * - Increment streak on is_on_diet=true
 * - Reset streak on is_on_diet=false
 * - Days without meals don't break the streak
 * - On tie, return the first sequence found (automatically handled)
 * 
 * @param {Array} meals - Meals ordered by datetime asc, each with is_on_diet property
 * @returns {number} Best streak count
 */
const calculateBestStreak = (meals) => {
  if (!meals || meals.length === 0) {
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

module.exports = { calculateBestStreak };
