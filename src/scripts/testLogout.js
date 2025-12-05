/**
 * Test Script for Logout Endpoint
 * Tests POST /v1/logout endpoint
 *
 * Run: npm run test:logout
 */

require('dotenv').config();
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:3000/v1';
const TEST_REQUEST_ID = `logout-test-${Date.now()}`;

// Test user data
const testUser = {
  name: 'Logout Test User',
  email: `logout-test-${Date.now()}@example.com`,
  password: 'testpassword123',
};

let createdUserId = null;

/**
 * Helper to make API requests
 */
const apiRequest = async (endpoint, options = {}) => {
  const { headers: customHeaders, ...restOptions } = options;
  
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return { status: response.status, data: null };
  }

  const data = await response.json();
  return { status: response.status, data };
};

/**
 * Log helper
 */
const log = (message) => {
  logger.info({
    request_id: TEST_REQUEST_ID,
    type: 'logout_test',
    message,
  });
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('\n🧪 Starting Logout tests...\n');
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

    // ===== TEST 1: Login to get tokens =====
    console.log('1️⃣  Getting tokens via login...');
    let accessToken = null;
    let refreshToken = null;

    try {
      const { status, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (status === 200 && data.token && data.refresh_token) {
        console.log('   ✅ Login successful, got tokens');
        accessToken = data.token;
        refreshToken = data.refresh_token;
      } else {
        console.log(`   ❌ Login failed: ${status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 2: Logout without auth should fail =====
    console.log('\n2️⃣  Testing logout without authentication (should fail)...');
    try {
      const { status, data } = await apiRequest('/logout', {
        method: 'POST',
      });

      if (status === 401 && data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ Returns 401 AUTH_ERROR without auth');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 3: Logout with auth returns 204 =====
    console.log('\n3️⃣  Testing logout with authentication...');
    try {
      const { status } = await apiRequest('/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (status === 204) {
        console.log('   ✅ Returns 204 No Content');
      } else {
        console.log(`   ❌ Expected 204, got ${status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 4: Verify all tokens are revoked in DB =====
    console.log('\n4️⃣  Verifying all tokens are revoked in database...');
    try {
      const activeTokens = await prisma.refreshToken.findMany({
        where: { user_id: createdUserId, revoked: false },
      });

      if (activeTokens.length === 0) {
        console.log('   ✅ No active tokens remain (all revoked)');
      } else {
        console.log(`   ❌ Found ${activeTokens.length} active tokens (expected 0)`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 5: Login again to test specific token revocation =====
    // NOTE: This test must run BEFORE the "revoked token rejected" test
    // because using a revoked token triggers security revocation of ALL tokens
    console.log('\n5️⃣  Testing specific token revocation...');
    try {
      // Login to get new tokens
      const loginRes = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (loginRes.status !== 200) {
        console.log(`   ❌ Login failed: ${loginRes.status}`);
        allTestsPassed = false;
      } else {
        const newAccessToken = loginRes.data.token;
        const newRefreshToken = loginRes.data.refresh_token;

        // Create a second session
        const secondLoginRes = await apiRequest('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        });

        if (secondLoginRes.status !== 200) {
          console.log(`   ❌ Second login failed: ${secondLoginRes.status}`);
          allTestsPassed = false;
        } else {
          const secondRefreshToken = secondLoginRes.data.refresh_token;

          // Verify we have 2 active tokens
          const tokensBefore = await prisma.refreshToken.findMany({
            where: { user_id: createdUserId, revoked: false },
          });

          if (tokensBefore.length !== 2) {
            console.log(`   ❌ Expected 2 active tokens, found ${tokensBefore.length}`);
            allTestsPassed = false;
          } else {
            console.log('   ✅ Created 2 active sessions');

            // Logout with specific token
            const logoutRes = await apiRequest('/logout', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${newAccessToken}`,
              },
              body: JSON.stringify({
                refresh_token: newRefreshToken,
              }),
            });

            if (logoutRes.status !== 204) {
              console.log(`   ❌ Logout failed: ${logoutRes.status}`);
              allTestsPassed = false;
            } else {
              // Verify only one token remains
              const tokensAfter = await prisma.refreshToken.findMany({
                where: { user_id: createdUserId, revoked: false },
              });

              if (tokensAfter.length === 1 && tokensAfter[0].token === secondRefreshToken) {
                console.log('   ✅ Only specific token was revoked, other remains active');
              } else {
                console.log(`   ❌ Expected 1 active token, found ${tokensAfter.length}`);
                allTestsPassed = false;
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 6: Logout all remaining tokens =====
    console.log('\n6️⃣  Testing logout all remaining tokens...');
    try {
      // Login to get fresh token
      const loginRes = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      if (loginRes.status === 200) {
        const freshAccessToken = loginRes.data.token;

        // Logout without specific token (revoke all)
        const logoutRes = await apiRequest('/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${freshAccessToken}`,
          },
        });

        if (logoutRes.status === 204) {
          console.log('   ✅ Logout all returned 204');

          // Verify no active tokens remain
          const tokensAfter = await prisma.refreshToken.findMany({
            where: { user_id: createdUserId, revoked: false },
          });

          if (tokensAfter.length === 0) {
            console.log('   ✅ All tokens successfully revoked');
          } else {
            console.log(`   ❌ Expected 0 active tokens, found ${tokensAfter.length}`);
            allTestsPassed = false;
          }
        } else {
          console.log(`   ❌ Logout failed: ${logoutRes.status}`);
          allTestsPassed = false;
        }
      } else {
        console.log(`   ❌ Login failed: ${loginRes.status}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 7: Old refresh token should not work =====
    // NOTE: This test is last because using revoked token triggers
    // security revocation of ALL user tokens
    console.log('\n7️⃣  Testing that old refresh token is rejected...');
    try {
      const { status, data } = await apiRequest('/refresh-token', {
        method: 'POST',
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (status === 401 && data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ Old refresh token correctly rejected');
      } else {
        console.log(`   ❌ Expected 401, got ${status}`);
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
      console.log('✅ All Logout tests PASSED!');
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
