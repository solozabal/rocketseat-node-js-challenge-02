/**
 * Session Controller
 * Handles authentication endpoints
 */

const authService = require('../services/authService');
const logger = require('../config/logger');

/**
 * Login - Create new session
 * POST /v1/sessions
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    logger.info({
      request_id: req.id,
      type: 'session_controller',
      message: 'Login attempt',
      email,
    });

    const tokens = await authService.login({ email, password }, req.id);

    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Token - Rotate tokens
 * POST /v1/refresh-token
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    logger.info({
      request_id: req.id,
      type: 'session_controller',
      message: 'Refresh token attempt',
    });

    const tokens = await authService.rotateRefreshToken(refresh_token, req.id);

    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

/**
 * Logout - Revoke refresh tokens
 * POST /v1/logout
 *
 * Revokes all active refresh tokens for the authenticated user.
 * Optionally accepts { refresh_token } to revoke only a specific token.
 *
 * @requires Authentication (JWT Bearer token)
 */
const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { refresh_token } = req.body || {};

    logger.info({
      request_id: req.id,
      type: 'session_controller',
      message: 'Logout attempt',
      userId,
      specificToken: !!refresh_token,
    });

    await authService.logout(userId, refresh_token, req.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refreshToken,
  logout,
};
