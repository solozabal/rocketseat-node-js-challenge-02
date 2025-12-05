/**
 * Metrics Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const { metricsController } = require('../../controllers');

const router = express.Router();

/**
 * @swagger
 * /v1/metrics:
 *   get:
 *     summary: Get diet metrics
 *     tags: [Metrics]
 *     description: Get diet statistics including total meals, on/off diet counts, and best streak
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.get('/', metricsController.getMetrics);

module.exports = router;
