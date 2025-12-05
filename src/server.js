require('dotenv').config();

const app = require('./app');
const logger = require('./config/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Health check available at http://localhost:${PORT}/v1/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
