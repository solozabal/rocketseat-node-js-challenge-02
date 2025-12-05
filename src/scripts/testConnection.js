/**
 * Database Connection Test Script
 * Validates PostgreSQL connection using Prisma
 *
 * Usage: npm run db:test
 */

require('dotenv').config();

const logger = require('../config/logger');
const { prisma, disconnectPrisma } = require('../config/database');

const testConnection = async () => {
  const requestId = `db-test-${Date.now()}`;

  logger.info({
    request_id: requestId,
    type: 'database',
    message: 'Testing database connection...',
  });

  try {
    // Execute a simple query to validate connection
    const result = await prisma.$queryRaw`SELECT 1 as connected`;

    logger.info({
      request_id: requestId,
      type: 'database',
      message: 'Database connection successful',
      result: result,
    });

    console.log('\n✅ Database connection test PASSED!\n');

    return true;
  } catch (error) {
    logger.error({
      request_id: requestId,
      type: 'database',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
    });

    console.error('\n❌ Database connection test FAILED!\n');
    console.error('Error:', error.message);

    if (error.code === 'P1001') {
      console.error('\nPossible causes:');
      console.error('  - PostgreSQL is not running');
      console.error('  - Wrong host or port in DATABASE_URL');
      console.error('  - Firewall blocking the connection');
    } else if (error.code === 'P1003') {
      console.error('\nPossible causes:');
      console.error('  - Database does not exist');
      console.error('  - Run: npx prisma migrate dev --name init');
    }

    return false;
  } finally {
    await disconnectPrisma();
    logger.info({
      request_id: requestId,
      type: 'database',
      message: 'Database connection closed',
    });
  }
};

// Run the test
testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
