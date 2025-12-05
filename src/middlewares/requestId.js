const { v4: uuidv4 } = require('uuid');

/**
 * Middleware that generates a unique request ID (UUID v4) for each request.
 * The ID is stored in req.id and added to the response headers.
 */
const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
