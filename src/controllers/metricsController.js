/**
 * Metrics Controller
 * Handles HTTP requests for diet metrics
 */

const metricsService = require('../services/metricsService');
const logger = require('../config/logger');

/**
 * Get diet metrics for authenticated user
 * GET /v1/metrics
 */
const getMetrics = async (req, res, next) => {
  try {
    const userId = req.user.id;

    logger.info({
      request_id: req.id,
      type: 'metrics_controller',
      message: 'Getting metrics',
      userId,
    });

    const metrics = await metricsService.getMetrics(userId, req.id);

    res.json(metrics);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMetrics,
};
