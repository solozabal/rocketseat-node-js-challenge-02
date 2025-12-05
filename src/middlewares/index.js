const requestIdMiddleware = require('./requestId');
const { validate, validateBody, validateQuery, validateParams } = require('./validate');
const { notFoundHandler, errorHandler } = require('./errorHandler');
const { authenticate, optionalAuth } = require('./auth');

module.exports = {
  requestIdMiddleware,
  validate,
  validateBody,
  validateQuery,
  validateParams,
  notFoundHandler,
  errorHandler,
  authenticate,
  optionalAuth,
};
