/**
 * Validation Middleware
 * Validates request body against Zod schemas
 */

const { ZodError } = require('zod');
const { AppError, ErrorCodes } = require('../errors');
const logger = require('../config/logger');

/**
 * Creates a validation middleware for the given schema
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {string} [source='body'] - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Parse and validate the request data
      const data = schema.parse(req[source]);

      // Replace request data with parsed/transformed data
      req[source] = data;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const details = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn({
          request_id: req.id,
          type: 'validation_error',
          source,
          details,
        });

        // Create AppError with validation details
        const appError = AppError.validation('Validation failed', details);
        return next(appError);
      }

      // Pass other errors to error handler
      next(error);
    }
  };
};

/**
 * Validates request body
 * @param {import('zod').ZodSchema} schema
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validates request query parameters
 * @param {import('zod').ZodSchema} schema
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validates request URL parameters
 * @param {import('zod').ZodSchema} schema
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams,
};
