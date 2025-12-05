/**
 * Test Script for Authentication Middleware
 * Tests protected routes (/v1/meals, /v1/metrics)
 *
 * Run: npm run test:auth
 */

require('dotenv').config();
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/v1';
const TEST_REQUEST_ID = `auth-middleware-test-${Date.now()}`;

// Test user data
const testUser = {
  name: 'Auth Middleware Test User',
  email: `auth-middleware-test-${Date.now()}@example.com`,
  password: 'testpassword123',
};

let createdUserId = null;
let validToken = null;

/**
 * Helper to make API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { status: response.status, data };
};

/**
 * Log helper
 */
const log = (message) => {
  logger.info({
    request_id: TEST_REQUEST_ID,
    type: 'auth_middleware_test',
    message,
  });
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('\n🧪 Starting Authentication Middleware tests...\n');
  console.log('═══════════════════════════════════════\n');

  let allTestsPassed = true;

  try {
    // ===== SETUP: Create test user and get token =====
    console.log('📝 Setting up test user and token...');
    const password_hash = await bcrypt.hash(testUser.password, 12);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password_hash,
      },
    });
    createdUserId = user.id;
    console.log(`   Created test user: ${user.email}`);

    // Login to get valid token
    const loginResponse = await apiRequest('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
      }),
    });
    validToken = loginResponse.data.token;
    console.log(`   Got valid token: ${validToken.substring(0, 20)}...`);
    console.log('');

    // ===== TEST 1: Access /meals without token =====
    console.log('1️⃣  Testing /meals without token (should return 401)...');
    try {
      const { status, data } = await apiRequest('/meals', {
        method: 'GET',
      });

      log(`No token meals response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 2: Access /metrics without token =====
    console.log('\n2️⃣  Testing /metrics without token (should return 401)...');
    try {
      const { status, data } = await apiRequest('/metrics', {
        method: 'GET',
      });

      log(`No token metrics response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 3: Access /meals with valid token =====
    console.log('\n3️⃣  Testing /meals with valid token (should return 200)...');
    try {
      const { status, data } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      log(`Valid token meals response: ${status}`);

      if (status === 200) {
        console.log('   ✅ Status 200 returned');
      } else {
        console.log(`   ❌ Expected 200, got ${status}`);
        allTestsPassed = false;
      }

      if (data.user?.id === createdUserId) {
        console.log('   ✅ req.user.id matches authenticated user');
      } else {
        console.log(`   ❌ req.user.id mismatch: ${data.user?.id} vs ${createdUserId}`);
        allTestsPassed = false;
      }

      if (data.user?.email === testUser.email) {
        console.log('   ✅ req.user.email matches authenticated user');
      } else {
        console.log(`   ❌ req.user.email mismatch`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 4: Access /metrics with valid token =====
    console.log('\n4️⃣  Testing /metrics with valid token (should return 200)...');
    try {
      const { status, data } = await apiRequest('/metrics', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validToken}`,
        },
      });

      log(`Valid token metrics response: ${status}`);

      if (status === 200) {
        console.log('   ✅ Status 200 returned');
      } else {
        console.log(`   ❌ Expected 200, got ${status}`);
        allTestsPassed = false;
      }

      if (data.user?.id === createdUserId) {
        console.log('   ✅ req.user.id matches authenticated user');
      } else {
        console.log(`   ❌ req.user.id mismatch`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 5: Access with invalid token =====
    console.log('\n5️⃣  Testing with invalid token (should return 401)...');
    try {
      const { status, data } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid.token.here',
        },
      });

      log(`Invalid token response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for invalid token');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 6: Access with expired token =====
    console.log('\n6️⃣  Testing with expired token (should return 401)...');
    try {
      // Create an expired token (expired 1 hour ago)
      const expiredToken = jwt.sign(
        { sub: createdUserId },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const { status, data } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      log(`Expired token response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for expired token');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }

      if (data.error?.message?.includes('expired')) {
        console.log('   ✅ Error message mentions token expiration');
      } else {
        console.log(`   ⚠️  Error message: ${data.error?.message}`);
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 7: Access with malformed Authorization header =====
    console.log('\n7️⃣  Testing with malformed Authorization header...');
    try {
      // Test without "Bearer " prefix
      const { status: status1 } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: validToken, // Missing "Bearer " prefix
        },
      });

      if (status1 === 401) {
        console.log('   ✅ Returns 401 for token without "Bearer " prefix');
      } else {
        console.log(`   ❌ Expected 401, got ${status1}`);
        allTestsPassed = false;
      }

      // Test with empty Authorization header
      const { status: status2 } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: '',
        },
      });

      if (status2 === 401) {
        console.log('   ✅ Returns 401 for empty Authorization header');
      } else {
        console.log(`   ❌ Expected 401, got ${status2}`);
        allTestsPassed = false;
      }

      // Test with "Bearer " but no token
      const { status: status3 } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ',
        },
      });

      if (status3 === 401) {
        console.log('   ✅ Returns 401 for "Bearer " with no token');
      } else {
        console.log(`   ❌ Expected 401, got ${status3}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 8: Public routes still accessible =====
    console.log('\n8️⃣  Testing public routes still accessible without token...');
    try {
      const { status: healthStatus } = await apiRequest('/health', {
        method: 'GET',
      });

      if (healthStatus === 200) {
        console.log('   ✅ /health is accessible without token');
      } else {
        console.log(`   ❌ /health returned ${healthStatus}`);
        allTestsPassed = false;
      }

      const { status: sessionsStatus } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (sessionsStatus === 200) {
        console.log('   ✅ /sessions is accessible without token');
      } else {
        console.log(`   ❌ /sessions returned ${sessionsStatus}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

  } catch (error) {
    console.error('❌ Test suite error:', error);
    allTestsPassed = false;
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    if (createdUserId) {
      await prisma.refreshToken.deleteMany({
        where: { user_id: createdUserId },
      });
      await prisma.user.delete({
        where: { id: createdUserId },
      });
      console.log('   Test user and tokens deleted');
    }

    await prisma.$disconnect();

    console.log('\n═══════════════════════════════════════');
    if (allTestsPassed) {
      console.log('✅ All Authentication Middleware tests PASSED!');
      console.log('═══════════════════════════════════════\n');
      process.exit(0);
    } else {
      console.log('❌ Some tests FAILED!');
      console.log('═══════════════════════════════════════\n');
      process.exit(1);
    }
  }
};

// Run tests
runTests();
