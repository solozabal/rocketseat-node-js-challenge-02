const express = require('express');

const router = express.Router();

/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     description: Check if the API is running. This endpoint is not rate limited.
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
