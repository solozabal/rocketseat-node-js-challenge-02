const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const logger = require('./logger');

/**
 * PrismaClient singleton instance
 * Ensures only one instance is created across the application
 */
let prisma;
let pool;

const createPrismaClient = () => {
  // Create PostgreSQL connection pool
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Create Prisma adapter
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'info',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  });

  // Log queries in development mode
  if (process.env.NODE_ENV === 'development') {
    client.$on('query', (e) => {
      logger.debug({
        type: 'prisma_query',
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  }

  // Log errors
  client.$on('error', (e) => {
    logger.error({
      type: 'prisma_error',
      message: e.message,
      target: e.target,
    });
  });

  // Log info
  client.$on('info', (e) => {
    logger.info({
      type: 'prisma_info',
      message: e.message,
    });
  });

  // Log warnings
  client.$on('warn', (e) => {
    logger.warn({
      type: 'prisma_warn',
      message: e.message,
    });
  });

  return client;
};

/**
 * Get PrismaClient singleton instance
 * @returns {PrismaClient}
 */
const getPrismaClient = () => {
  if (!prisma) {
    prisma = createPrismaClient();
    logger.info({
      type: 'database',
      message: 'PrismaClient instance created',
    });
  }
  return prisma;
};

/**
 * Disconnect PrismaClient
 * Should be called when the application shuts down
 */
const disconnectPrisma = async () => {
  if (prisma) {
    await prisma.$disconnect();
    logger.info({
      type: 'database',
      message: 'PrismaClient disconnected',
    });
    prisma = null;
  }
  if (pool) {
    await pool.end();
    logger.info({
      type: 'database',
      message: 'PostgreSQL pool closed',
    });
    pool = null;
  }
};

// Export singleton instance and utilities
module.exports = {
  prisma: getPrismaClient(),
  getPrismaClient,
  disconnectPrisma,
};
