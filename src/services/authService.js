/**
 * Authentication Service
 * Handles JWT token generation and refresh token management
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { prisma } = require('../config/database');
const { AppError } = require('../errors');
const logger = require('../config/logger');

// Token configuration
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

/**
 * Get JWT secret from environment
 * @returns {string} JWT secret
 */
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

/**
 * Generate access token (JWT)
 * @param {string} userId - User ID to include in claims
 * @returns {string} Signed JWT token
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { sub: userId },
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
};

/**
 * Generate secure refresh token
 * @returns {string} Random secure token
 */
const generateRefreshToken = () => {
  return crypto.randomUUID();
};

/**
 * Calculate refresh token expiration date
 * @returns {Date} Expiration date (7 days from now)
 */
const getRefreshTokenExpiration = () => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expiresAt;
};

/**
 * Authenticate user and generate tokens
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Token pair { token, refresh_token }
 */
const login = async ({ email, password }, requestId) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    logger.warn({
      request_id: requestId,
      type: 'auth_service',
      message: 'Login failed - user not found',
      email,
    });
    throw AppError.auth('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    logger.warn({
      request_id: requestId,
      type: 'auth_service',
      message: 'Login failed - invalid password',
      email,
    });
    throw AppError.auth('Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  const expiresAt = getRefreshTokenExpiration();

  // Persist refresh token
  await prisma.refreshToken.create({
    data: {
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
      revoked: false,
    },
  });

  logger.info({
    request_id: requestId,
    type: 'auth_service',
    message: 'Login successful',
    userId: user.id,
  });

  return {
    token: accessToken,
    refresh_token: refreshToken,
  };
};

/**
 * Verify access token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.auth('Token expired');
    }
    throw AppError.auth('Invalid token');
  }
};

/**
 * Find valid refresh token
 * @param {string} token - Refresh token
 * @returns {Promise<Object|null>} Refresh token record or null
 */
const findRefreshToken = async (token) => {
  return prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });
};

/**
 * Revoke refresh token
 * @param {string} tokenId - Refresh token ID
 * @returns {Promise<Object>} Updated refresh token
 */
const revokeRefreshToken = async (tokenId) => {
  return prisma.refreshToken.update({
    where: { id: tokenId },
    data: { revoked: true },
  });
};

/**
 * Revoke all refresh tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
const revokeAllUserTokens = async (userId) => {
  return prisma.refreshToken.updateMany({
    where: { user_id: userId, revoked: false },
    data: { revoked: true },
  });
};

module.exports = {
  login,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_DAYS,
};
