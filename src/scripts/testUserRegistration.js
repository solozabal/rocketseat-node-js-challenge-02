/**
 * User Registration Test Script
 * Tests POST /v1/users endpoint
 *
 * Usage: npm run test:users
 * Requires: Server running on port 3000 and PostgreSQL running
 */

require('dotenv').config();

const logger = require('../config/logger');
const { prisma, disconnectPrisma } = require('../config/database');

const BASE_URL = 'http://localhost:3000/v1';
const requestId = `user-test-${Date.now()}`;

const log = (message) => {
  console.log(`   ${message}`);
  logger.info({ request_id: requestId, type: 'user_test', message });
};

const logSuccess = (message) => {
  console.log(`   ✅ ${message}`);
};

const logError = (message) => {
  console.log(`   ❌ ${message}`);
};

// Simple fetch wrapper
const apiRequest = async (method, path, body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();

  return { status: response.status, data };
};

const runTests = async () => {
  console.log('\n🧪 Starting User Registration tests...\n');
  console.log('═══════════════════════════════════════');

  let allPassed = true;
  const testEmail = `test-${Date.now()}@example.com`;
  let createdUserId = null;

  try {
    // ==================== TEST 1: Create User Successfully ====================
    console.log('\n1️⃣  Testing successful user creation...');

    const createResponse = await apiRequest('POST', '/users', {
      name: 'Test User',
      email: testEmail,
      password: 'secret123',
    });

    if (createResponse.status === 201) {
      logSuccess(`Status 201 returned`);
      createdUserId = createResponse.data.user?.id;

      if (createResponse.data.user) {
        logSuccess(`User object returned`);
        log(`User ID: ${createResponse.data.user.id}`);
        log(`User email: ${createResponse.data.user.email}`);

        // Check password is NOT returned
        if (!createResponse.data.user.password && !createResponse.data.user.password_hash) {
          logSuccess(`Password NOT exposed in response`);
        } else {
          logError(`Password exposed in response!`);
          allPassed = false;
        }

        // Check required fields
        if (createResponse.data.user.id && createResponse.data.user.name && createResponse.data.user.email) {
          logSuccess(`All required fields present (id, name, email)`);
        } else {
          logError(`Missing required fields`);
          allPassed = false;
        }
      } else {
        logError(`User object not returned`);
        allPassed = false;
      }
    } else {
      logError(`Expected status 201, got ${createResponse.status}`);
      log(`Response: ${JSON.stringify(createResponse.data)}`);
      allPassed = false;
    }

    // ==================== TEST 2: Duplicate Email → 409 CONFLICT ====================
    console.log('\n2️⃣  Testing duplicate email (should return 409 CONFLICT)...');

    const duplicateResponse = await apiRequest('POST', '/users', {
      name: 'Another User',
      email: testEmail, // Same email
      password: 'secret456',
    });

    if (duplicateResponse.status === 409) {
      logSuccess(`Status 409 returned for duplicate email`);

      if (duplicateResponse.data.error?.code === 'CONFLICT') {
        logSuccess(`error.code is CONFLICT`);
      } else {
        logError(`error.code is not CONFLICT: ${duplicateResponse.data.error?.code}`);
        allPassed = false;
      }

      if (duplicateResponse.data.error?.request_id) {
        logSuccess(`request_id present in error response`);
      } else {
        logError(`request_id missing in error response`);
        allPassed = false;
      }
    } else {
      logError(`Expected status 409, got ${duplicateResponse.status}`);
      log(`Response: ${JSON.stringify(duplicateResponse.data)}`);
      allPassed = false;
    }

    // ==================== TEST 3: Validation Error → 400 ====================
    console.log('\n3️⃣  Testing validation errors...');

    // Missing name
    const missingNameResponse = await apiRequest('POST', '/users', {
      email: 'test@example.com',
      password: 'secret123',
    });

    log(`Missing name response: ${missingNameResponse.status} - ${JSON.stringify(missingNameResponse.data)}`);

    if (missingNameResponse.status === 400 && missingNameResponse.data.error?.code === 'VALIDATION_ERROR') {
      logSuccess(`Missing name returns 400 VALIDATION_ERROR`);
    } else {
      logError(`Missing name should return 400 VALIDATION_ERROR, got ${missingNameResponse.status}`);
      allPassed = false;
    }

    // Invalid email
    const invalidEmailResponse = await apiRequest('POST', '/users', {
      name: 'Test',
      email: 'not-an-email',
      password: 'secret123',
    });

    log(`Invalid email response: ${invalidEmailResponse.status} - ${JSON.stringify(invalidEmailResponse.data)}`);

    if (invalidEmailResponse.status === 400 && invalidEmailResponse.data.error?.code === 'VALIDATION_ERROR') {
      logSuccess(`Invalid email returns 400 VALIDATION_ERROR`);
    } else {
      logError(`Invalid email should return 400 VALIDATION_ERROR, got ${invalidEmailResponse.status}`);
      allPassed = false;
    }

    // Password too short
    const shortPasswordResponse = await apiRequest('POST', '/users', {
      name: 'Test',
      email: 'test2@example.com',
      password: '12345',
    });

    log(`Short password response: ${shortPasswordResponse.status} - ${JSON.stringify(shortPasswordResponse.data)}`);

    if (shortPasswordResponse.status === 400 && shortPasswordResponse.data.error?.code === 'VALIDATION_ERROR') {
      logSuccess(`Short password returns 400 VALIDATION_ERROR`);
    } else {
      logError(`Short password should return 400 VALIDATION_ERROR, got ${shortPasswordResponse.status}`);
      allPassed = false;
    }

    // ==================== TEST 4: Verify password is hashed in DB ====================
    console.log('\n4️⃣  Testing password hash in database...');

    if (createdUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { id: createdUserId },
      });

      if (dbUser) {
        if (dbUser.password_hash && dbUser.password_hash !== 'secret123') {
          logSuccess(`Password is hashed in database`);
          log(`Hash starts with: ${dbUser.password_hash.substring(0, 10)}...`);

          // Check bcrypt format ($2b$12$...)
          if (dbUser.password_hash.startsWith('$2b$12$') || dbUser.password_hash.startsWith('$2a$12$')) {
            logSuccess(`Bcrypt hash with 12 rounds detected`);
          } else {
            logError(`Hash format unexpected: ${dbUser.password_hash.substring(0, 7)}`);
            allPassed = false;
          }
        } else {
          logError(`Password not properly hashed`);
          allPassed = false;
        }
      } else {
        logError(`User not found in database`);
        allPassed = false;
      }
    } else {
      logError(`Cannot verify hash - user was not created`);
      allPassed = false;
    }

  } catch (error) {
    logError(`Test error: ${error.message}`);
    console.error(error);
    allPassed = false;
  } finally {
    // Cleanup: Delete test user
    console.log('\n🧹 Cleaning up test data...');
    if (createdUserId) {
      try {
        await prisma.user.delete({ where: { id: createdUserId } });
        log(`Test user deleted`);
      } catch (e) {
        log(`Could not delete test user: ${e.message}`);
      }
    }

    await disconnectPrisma();
  }

  // ==================== SUMMARY ====================
  console.log('\n═══════════════════════════════════════');
  if (allPassed) {
    console.log('✅ All User Registration tests PASSED!');
    console.log('═══════════════════════════════════════\n');
    return true;
  } else {
    console.log('❌ Some tests FAILED!');
    console.log('═══════════════════════════════════════\n');
    return false;
  }
};

// Run the tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
