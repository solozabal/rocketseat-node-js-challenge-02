const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const logger = require('./config/logger');
const { requestIdMiddleware } = require('./middlewares');
const routes = require('./routes');

const app = express();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Request ID middleware - must be first to ensure all logs have request_id
app.use(requestIdMiddleware);

// CORS configuration
const corsOptions = {
  origin: isProduction
    ? process.env.CORS_ORIGIN
    : 'http://localhost:3000',
  credentials: true,
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error({
    request_id: req.id,
    error: err.message,
    stack: err.stack,
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: isProduction ? 'An unexpected error occurred' : err.message,
  });
});

module.exports = app;
