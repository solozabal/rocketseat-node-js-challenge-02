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
 * POST /v1/refresh-token
 * Rotate refresh token and get new token pair
 */
router.post('/', validateBody(refreshTokenSchema), sessionController.refreshToken);

module.exports = router;
