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
 * POST /v1/sessions
 * Login and get tokens
 */
router.post('/', validateBody(loginSchema), sessionController.login);

module.exports = router;
