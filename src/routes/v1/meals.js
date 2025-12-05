/**
 * Meals Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const router = express.Router();

/**
 * GET /v1/meals
 * List all meals for authenticated user
 * (Placeholder - to be implemented)
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Meals endpoint - protected',
    user: req.user,
  });
});

/**
 * POST /v1/meals
 * Create a new meal
 * (Placeholder - to be implemented)
 */
router.post('/', (req, res) => {
  res.status(201).json({
    message: 'Create meal endpoint - protected',
    user: req.user,
  });
});

module.exports = router;
