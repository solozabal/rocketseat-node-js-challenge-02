/**
 * Metrics Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const { metricsController } = require('../../controllers');

const router = express.Router();

/**
 * GET /v1/metrics
 * Get diet metrics for authenticated user
 */
router.get('/', metricsController.getMetrics);

module.exports = router;
