/**
 * Rate Limiter Middleware
 * Limits requests per IP to prevent abuse
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// Use higher limit in development/test environments
const isProduction = process.env.NODE_ENV === 'production';
const maxRequests = isProduction ? 100 : 1000;

/**
 * Rate limit configuration
 * Production: 100 requests per 15 minutes per IP
 * Development/Test: 1000 requests per 15 minutes per IP
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Skip rate limiting for health check endpoint
  skip: (req) => req.path === '/v1/health',
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn({
      request_id: req.id,
      type: 'rate_limit',
      message: 'Rate limit exceeded',
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests',
        request_id: req.id,
      },
    });
  },

  // Use default key generator (handles IPv6 correctly)
  // Default uses req.ip which is already handled by express-rate-limit
});

module.exports = rateLimiter;
