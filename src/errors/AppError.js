/**
 * Custom Application Error
 * Base error class with error code support
 */

const { ErrorCodes, ErrorHttpStatus, ErrorMessages } = require('./errorCodes');

class AppError extends Error {
  /**
   * @param {string} code - Error code from ErrorCodes
   * @param {string} [message] - Custom error message
   * @param {Array} [details] - Additional error details
   */
  constructor(code, message, details = []) {
    super(message || ErrorMessages[code] || 'An error occurred');
    
    this.name = 'AppError';
    this.code = code;
    this.status = ErrorHttpStatus[code] || 500;
    this.details = details;
    
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Array} details - Validation error details
   */
  static validation(message, details = []) {
    return new AppError(ErrorCodes.VALIDATION_ERROR, message, details);
  }

  /**
   * Create an authentication error
   * @param {string} [message] - Error message
   */
  static auth(message = 'Invalid credentials') {
    return new AppError(ErrorCodes.AUTH_ERROR, message);
  }

  /**
   * Create a forbidden error
   * @param {string} [message] - Error message
   */
  static forbidden(message = 'Access denied') {
    return new AppError(ErrorCodes.FORBIDDEN, message);
  }

  /**
   * Create a not found error
   * @param {string} [resource] - Resource name
   */
  static notFound(resource = 'Resource') {
    return new AppError(ErrorCodes.NOT_FOUND, `${resource} not found`);
  }

  /**
   * Create a conflict error
   * @param {string} [message] - Error message
   */
  static conflict(message = 'Resource already exists') {
    return new AppError(ErrorCodes.CONFLICT, message);
  }

  /**
   * Create a rate limit error
   * @param {string} [message] - Error message
   */
  static rateLimited(message = 'Too many requests, please try again later') {
    return new AppError(ErrorCodes.RATE_LIMITED, message);
  }

  /**
   * Create an internal error
   * @param {string} [message] - Error message
   */
  static internal(message = 'An unexpected error occurred') {
    return new AppError(ErrorCodes.INTERNAL_ERROR, message);
  }
}

module.exports = AppError;
