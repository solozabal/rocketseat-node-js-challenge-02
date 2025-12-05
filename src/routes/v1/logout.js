/**
 * Logout Routes
 * POST /v1/logout - Revoke refresh tokens
 */

const express = require('express');
const sessionController = require('../../controllers/sessionController');

const router = express.Router();

/**
 * POST /v1/logout
 * Revoke all active refresh tokens for the authenticated user.
 * Optionally accepts { refresh_token } to revoke only a specific token.
 *
 * @requires Authentication (JWT Bearer token)
 *
 * @body {string} [refresh_token] - Optional specific token to revoke
 *
 * @returns {void} 204 No Content
 */
router.post('/', sessionController.logout);

module.exports = router;
