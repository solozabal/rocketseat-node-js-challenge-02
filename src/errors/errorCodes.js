/**
 * Error Codes for API responses
 * Standardized error codes for consistent error handling
 */

const ErrorCodes = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Authentication errors (401)
  AUTH_ERROR: 'AUTH_ERROR',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',

  // Resource not found (404)
  NOT_FOUND: 'NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',

  // Internal server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/**
 * HTTP Status codes mapped to error codes
 */
const ErrorHttpStatus = {
  [ErrorCodes.VALIDATION_ERROR]: 400,
  [ErrorCodes.AUTH_ERROR]: 401,
  [ErrorCodes.FORBIDDEN]: 403,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.CONFLICT]: 409,
  [ErrorCodes.RATE_LIMITED]: 429,
  [ErrorCodes.INTERNAL_ERROR]: 500,
};

/**
 * Default error messages
 */
const ErrorMessages = {
  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCodes.AUTH_ERROR]: 'Authentication failed',
  [ErrorCodes.FORBIDDEN]: 'Access denied',
  [ErrorCodes.NOT_FOUND]: 'Resource not found',
  [ErrorCodes.CONFLICT]: 'Resource already exists',
  [ErrorCodes.RATE_LIMITED]: 'Too many requests',
  [ErrorCodes.INTERNAL_ERROR]: 'Internal server error',
};

module.exports = {
  ErrorCodes,
  ErrorHttpStatus,
  ErrorMessages,
};
