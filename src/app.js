const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./config/logger');
const { requestIdMiddleware, notFoundHandler, errorHandler, rateLimiter } = require('./middlewares');
const routes = require('./routes');

const app = express();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Request ID middleware - must be first to ensure all logs have request_id
app.use(requestIdMiddleware);

// Rate limiting - 100 requests per 15 minutes per IP
app.use(rateLimiter);

// CORS configuration
const corsOrigins = isProduction
  ? (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

const corsOptions = {
  origin: corsOrigins.length > 0 ? corsOrigins : false,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Helmet security configuration
app.use(
  helmet({
    hidePoweredBy: true,
    noSniff: true,
    frameguard: { action: 'deny' },
    contentSecurityPolicy: false, // Disabled for JSON API
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan HTTP logger with request_id
morgan.token('request-id', (req) => req.id);
const morganFormat = ':request-id :method :url :status :res[content-length] - :response-time ms';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  })
);

// API Routes with /v1 prefix
app.use('/', routes);

// 404 handler - catches unmatched routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;
