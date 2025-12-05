/**
 * Session Routes
 * Authentication endpoints
 */

const express = require('express');
const router = express.Router();
const sessionController = require('../../controllers/sessionController');
const { validateBody } = require('../../middlewares/validate');
const { loginSchema } = require('../../validators');

/**
 * @swagger
 * /v1/sessions:
 *   post:
 *     summary: Login and get tokens
 *     tags: [Auth]
 *     description: Authenticate user and receive access and refresh tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Test123!@#
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT access token (15 min expiry)
 *                 refresh_token:
 *                   type: string
 *                   description: Refresh token (7 days expiry)
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.post('/', validateBody(loginSchema), sessionController.login);

module.exports = router;
