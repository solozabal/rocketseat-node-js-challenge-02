/**
 * Metrics Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const router = express.Router();

/**
 * GET /v1/metrics
 * Get diet metrics for authenticated user
 * (Placeholder - to be implemented)
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Metrics endpoint - protected',
    user: req.user,
  });
});

module.exports = router;
