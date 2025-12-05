const { createUserSchema, updateUserSchema } = require('./userValidator');
const { createMealSchema, updateMealSchema } = require('./mealValidator');
const { loginSchema, refreshTokenSchema } = require('./sessionValidator');

module.exports = {
  // User validators
  createUserSchema,
  updateUserSchema,

  // Meal validators
  createMealSchema,
  updateMealSchema,

  // Session validators
  loginSchema,
  refreshTokenSchema,
};
