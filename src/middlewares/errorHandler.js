/**
 * Global Error Handler Middleware
 * Returns standardized error envelope with request_id
 */

const { AppError, ErrorCodes } = require('../errors');
const logger = require('../config/logger');

/**
 * Format error response with standard envelope
 * @param {Error} err - Error object
 * @param {string} requestId - Request ID
 * @param {boolean} isProduction - Whether in production mode
 */
const formatErrorResponse = (err, requestId, isProduction) => {
  const response = {
    error: {
      code: err.code || ErrorCodes.INTERNAL_ERROR,
      message: err.message || 'An unexpected error occurred',
      request_id: requestId,
    },
  };

  // Include details if present (e.g., validation errors)
  if (err.details && err.details.length > 0) {
    response.error.details = err.details;
  }

  // Include stack trace in development
  if (!isProduction && err.stack) {
    response.error.stack = err.stack;
  }

  return response;
};

/**
 * Not Found (404) handler middleware
 * Creates AppError for unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  const error = AppError.notFound(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Global error handler middleware
 * Must be registered last, after all routes
 */
const errorHandler = (err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Determine if this is an AppError or unknown error
  let error = err;

  if (!(err instanceof AppError)) {
    // Handle specific error types
    if (err.name === 'SyntaxError' && err.body) {
      // JSON parse error
      error = AppError.validation('Invalid JSON in request body');
    } else if (err.name === 'PayloadTooLargeError') {
      error = AppError.validation('Request payload too large');
    } else if (err.code === 'P2002') {
      // Prisma unique constraint violation
      const field = err.meta?.target?.[0] || 'field';
      error = AppError.conflict(`${field} already exists`);
    } else if (err.code === 'P2025') {
      // Prisma record not found
      error = AppError.notFound('Record');
    } else {
      // Unknown error - wrap in AppError
      error = AppError.internal(
        isProduction ? 'An unexpected error occurred' : err.message
      );
      error.originalError = err;
    }
  }

  // Log error
  const logData = {
    request_id: req.id,
    type: 'error',
    code: error.code,
    message: error.message,
    status: error.status,
    path: req.path,
    method: req.method,
  };

  // Add stack trace for server errors
  if (error.status >= 500) {
    logData.stack = err.stack;
    logger.error(logData);
  } else {
    logger.warn(logData);
  }

  // Send error response
  const response = formatErrorResponse(error, req.id, isProduction);
  res.status(error.status).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
