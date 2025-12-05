/**
 * Authentication Middleware
 * Validates JWT Bearer tokens and protects routes
 */

const { verifyAccessToken } = require('../services/authService');
const { prisma } = require('../config/database');
const { AppError } = require('../errors');
const logger = require('../config/logger');

/**
 * Extract Bearer token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} Token or null
 */
const extractBearerToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7); // Remove 'Bearer ' prefix
};

/**
 * Authentication middleware
 * Validates JWT token and loads user into req.user
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      logger.warn({
        request_id: req.id,
        type: 'auth_middleware',
        message: 'No token provided',
        path: req.path,
      });
      throw AppError.auth('Authentication required');
    }

    // Verify JWT token
    const decoded = verifyAccessToken(token);

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      logger.warn({
        request_id: req.id,
        type: 'auth_middleware',
        message: 'User not found for token',
        userId: decoded.sub,
      });
      throw AppError.auth('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
    };

    logger.info({
      request_id: req.id,
      type: 'auth_middleware',
      message: 'User authenticated',
      userId: user.id,
    });

    next();
  } catch (error) {
    // If it's already an AppError, pass it through
    if (error instanceof AppError) {
      return next(error);
    }

    // Handle unexpected errors
    logger.error({
      request_id: req.id,
      type: 'auth_middleware',
      message: 'Authentication error',
      error: error.message,
    });

    next(AppError.auth('Authentication failed'));
  }
};

/**
 * Optional authentication middleware
 * Loads user if token present, but doesn't require it
 * Useful for routes that behave differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      // No token, continue without user
      req.user = null;
      return next();
    }

    // Verify JWT token
    const decoded = verifyAccessToken(token);

    // Load user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
      },
    });

    req.user = user ? { id: user.id, email: user.email } : null;
    next();
  } catch (error) {
    // Token invalid/expired, continue without user
    req.user = null;
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  extractBearerToken,
};
