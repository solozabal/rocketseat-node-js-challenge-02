/**
 * Logout Routes
 * POST /v1/logout - Revoke refresh tokens
 */

const express = require('express');
const sessionController = require('../../controllers/sessionController');

const router = express.Router();

/**
 * @swagger
 * /v1/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     description: Revoke all refresh tokens for the authenticated user, or a specific token if provided
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refresh_token:
 *                 type: string
 *                 description: Optional - specific token to revoke. If omitted, all tokens are revoked.
 *     responses:
 *       204:
 *         description: Logout successful (no content)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.post('/', sessionController.logout);

module.exports = router;
