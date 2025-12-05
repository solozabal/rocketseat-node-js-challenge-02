/**
 * Test Script for Refresh Token Rotation
 * Tests POST /v1/refresh-token endpoint
 *
 * Run: npm run test:refresh
 */

require('dotenv').config();
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:3000/v1';
const TEST_REQUEST_ID = `refresh-token-test-${Date.now()}`;

// Test user data
const testUser = {
  name: 'Refresh Token Test User',
  email: `refresh-test-${Date.now()}@example.com`,
  password: 'testpassword123',
};

let createdUserId = null;

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
    type: 'refresh_token_test',
    message,
  });
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('\n🧪 Starting Refresh Token Rotation tests...\n');
  console.log('═══════════════════════════════════════\n');

  let allTestsPassed = true;

  try {
    // ===== SETUP: Create test user =====
    console.log('📝 Setting up test user...');
    const password_hash = await bcrypt.hash(testUser.password, 12);
    const user = await prisma.user.create({
      data: {
        name: testUser.name,
        email: testUser.email,
        password_hash,
      },
    });
    createdUserId = user.id;
    console.log(`   Created test user: ${user.email}\n`);

    // ===== TEST 1: Login to get initial tokens =====
    console.log('1️⃣  Getting initial tokens via login...');
    let currentRefreshToken = null;
    let currentAccessToken = null;
    
    try {
      const { status, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (status === 200 && data.token && data.refresh_token) {
        console.log('   ✅ Login successful, got initial tokens');
        currentAccessToken = data.token;
        currentRefreshToken = data.refresh_token;
        console.log(`   Access token: ${currentAccessToken.substring(0, 20)}...`);
        console.log(`   Refresh token: ${currentRefreshToken.substring(0, 8)}...`);
      } else {
        console.log(`   ❌ Login failed: ${status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 2: Rotate refresh token successfully =====
    console.log('\n2️⃣  Testing successful token rotation...');
    let oldRefreshToken = currentRefreshToken;
    
    try {
      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: currentRefreshToken,
        }),
      });

      log(`Rotation response: ${status}`);

      if (status === 200) {
        console.log('   ✅ Status 200 returned');
      } else {
        console.log(`   ❌ Expected 200, got ${status}`);
        console.log(`   Response: ${JSON.stringify(data)}`);
        allTestsPassed = false;
      }

      if (data.token) {
        console.log('   ✅ New access token returned');
        currentAccessToken = data.token;
      } else {
        console.log('   ❌ No access token in response');
        allTestsPassed = false;
      }

      if (data.refresh_token) {
        console.log('   ✅ New refresh token returned');
        if (data.refresh_token !== oldRefreshToken) {
          console.log('   ✅ New refresh token is different from old one');
          currentRefreshToken = data.refresh_token;
        } else {
          console.log('   ❌ New refresh token is the same as old one');
          allTestsPassed = false;
        }
      } else {
        console.log('   ❌ No refresh token in response');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 3: Verify old token is revoked in DB =====
    console.log('\n3️⃣  Verifying old token is revoked in database...');
    try {
      const oldToken = await prisma.refreshToken.findUnique({
        where: { token: oldRefreshToken },
      });

      if (oldToken && oldToken.revoked === true) {
        console.log('   ✅ Old refresh token is marked as revoked=true');
      } else {
        console.log(`   ❌ Old token revoked status: ${oldToken?.revoked}`);
        allTestsPassed = false;
      }

      // Verify new token exists and is not revoked
      const newToken = await prisma.refreshToken.findUnique({
        where: { token: currentRefreshToken },
      });

      if (newToken && newToken.revoked === false) {
        console.log('   ✅ New refresh token exists with revoked=false');
      } else {
        console.log(`   ❌ New token status: revoked=${newToken?.revoked}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 4: Multiple rotations work correctly =====
    // NOTE: This test MUST run BEFORE the revoked token test
    // because using a revoked token triggers security revocation of ALL user tokens
    console.log('\n4️⃣  Testing multiple consecutive rotations...');
    try {
      let lastRefreshToken = currentRefreshToken;
      
      for (let i = 1; i <= 3; i++) {
        const { status, data } = await apiRequest('/refresh-token', {
          method: 'POST',
          body: JSON.stringify({
            refresh_token: lastRefreshToken,
          }),
        });

        if (status === 200 && data.refresh_token !== lastRefreshToken) {
          console.log(`   ✅ Rotation ${i} successful`);
          lastRefreshToken = data.refresh_token;
          currentRefreshToken = data.refresh_token;
          currentAccessToken = data.token;
        } else {
          console.log(`   ❌ Rotation ${i} failed: status=${status}`);
          allTestsPassed = false;
          break;
        }
      }

      // Verify only one active token exists
      const activeTokens = await prisma.refreshToken.findMany({
        where: { user_id: createdUserId, revoked: false },
      });

      if (activeTokens.length === 1) {
        console.log('   ✅ Only one active (non-revoked) token exists');
      } else {
        console.log(`   ❌ Expected 1 active token, found ${activeTokens.length}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 5: Verify new token can be used for protected routes =====
    console.log('\n5️⃣  Testing new access token works for protected routes...');
    try {
      const { status, data } = await apiRequest('/meals', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${currentAccessToken}`,
        },
      });

      if (status === 200) {
        console.log('   ✅ New access token works for protected routes');
      } else {
        console.log(`   ❌ Expected 200, got ${status}`);
        allTestsPassed = false;
      }

      if (data.user?.id === createdUserId) {
        console.log('   ✅ User ID matches in req.user');
      } else {
        console.log(`   ❌ User ID mismatch`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 6: Try to use revoked token (should fail) =====
    // NOTE: This test triggers security revocation of ALL user tokens
    // so it must run AFTER the multiple rotations test
    console.log('\n6️⃣  Testing with revoked token (should return 401)...');
    try {
      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: oldRefreshToken,
        }),
      });

      log(`Revoked token response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for revoked token');
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

    // ===== TEST 7: Try with non-existent token =====
    console.log('\n7️⃣  Testing with non-existent token (should return 401)...');
    try {
      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: 'non-existent-token-12345',
        }),
      });

      log(`Non-existent token response: ${status}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for non-existent token');
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

    // ===== TEST 8: Test with expired token =====
    console.log('\n8️⃣  Testing with expired token (should return 401)...');
    try {
      // Create an expired token directly in DB
      const expiredToken = await prisma.refreshToken.create({
        data: {
          user_id: createdUserId,
          token: `expired-token-${Date.now()}`,
          expires_at: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
          revoked: false,
        },
      });

      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: expiredToken.token,
        }),
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

      // Verify expired token is now revoked
      const updatedExpiredToken = await prisma.refreshToken.findUnique({
        where: { id: expiredToken.id },
      });

      if (updatedExpiredToken?.revoked === true) {
        console.log('   ✅ Expired token was marked as revoked');
      } else {
        console.log('   ⚠️  Expired token was not marked as revoked');
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 9: Validation error (missing refresh_token) =====
    console.log('\n9️⃣  Testing validation error (missing refresh_token)...');
    try {
      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (status === 400 && data.error?.code === 'VALIDATION_ERROR') {
        console.log('   ✅ Returns 400 VALIDATION_ERROR for missing token');
      } else {
        console.log(`   ❌ Expected 400 VALIDATION_ERROR, got ${status} ${data.error?.code}`);
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
      console.log('✅ All Refresh Token Rotation tests PASSED!');
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
