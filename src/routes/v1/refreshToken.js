/**
 * Refresh Token Routes
 * Token rotation endpoint
 */

const express = require('express');
const router = express.Router();
const sessionController = require('../../controllers/sessionController');
const { validateBody } = require('../../middlewares/validate');
const { refreshTokenSchema } = require('../../validators');

/**
 * @swagger
 * /v1/refresh-token:
 *   post:
 *     summary: Rotate refresh token
 *     tags: [Auth]
 *     description: Exchange a valid refresh token for a new token pair. The old refresh token is revoked.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Current valid refresh token
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 token:
 *                   type: string
 *                   description: New JWT access token
 *                 refresh_token:
 *                   type: string
 *                   description: New refresh token
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid or expired refresh token
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.post('/', validateBody(refreshTokenSchema), sessionController.refreshToken);

module.exports = router;
