/**
 * Test Script for Authentication (Login/Sessions)
 * Tests POST /v1/sessions endpoint
 *
 * Run: npm run test:sessions
 */

require('dotenv').config();
const { prisma } = require('../config/database');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:3000/v1';
const TEST_REQUEST_ID = `auth-test-${Date.now()}`;

// Test user data
const testUser = {
  name: 'Auth Test User',
  email: `auth-test-${Date.now()}@example.com`,
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
    type: 'auth_test',
    message,
  });
};

/**
 * Main test function
 */
const runTests = async () => {
  console.log('\n🧪 Starting Authentication tests...\n');
  console.log('═══════════════════════════════════════\n');

  let allTestsPassed = true;

  try {
    // ===== SETUP: Create test user directly in DB =====
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

    // ===== TEST 1: Successful login =====
    console.log('1️⃣  Testing successful login...');
    try {
      const { status, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      });

      log(`Login response: ${status} - ${JSON.stringify(data)}`);

      if (status === 200) {
        console.log('   ✅ Status 200 returned');
      } else {
        console.log(`   ❌ Expected status 200, got ${status}`);
        allTestsPassed = false;
      }

      if (data.token) {
        console.log('   ✅ Access token returned');
        
        // Verify JWT structure
        try {
          const decoded = jwt.verify(data.token, process.env.JWT_SECRET);
          if (decoded.sub === createdUserId) {
            console.log('   ✅ JWT contains correct user ID in sub claim');
          } else {
            console.log(`   ❌ JWT sub claim mismatch. Expected: ${createdUserId}, Got: ${decoded.sub}`);
            allTestsPassed = false;
          }
          
          // Check expiration (should be ~15 minutes)
          const now = Math.floor(Date.now() / 1000);
          const expiresIn = decoded.exp - now;
          if (expiresIn > 800 && expiresIn <= 900) { // Between 13-15 minutes
            console.log(`   ✅ JWT expires in ~15 minutes (${Math.round(expiresIn / 60)} min)`);
          } else {
            console.log(`   ⚠️  JWT expiration: ${Math.round(expiresIn / 60)} minutes`);
          }
        } catch (jwtError) {
          console.log(`   ❌ JWT verification failed: ${jwtError.message}`);
          allTestsPassed = false;
        }
      } else {
        console.log('   ❌ No access token in response');
        allTestsPassed = false;
      }

      if (data.refresh_token) {
        console.log('   ✅ Refresh token returned');
        console.log(`   Refresh token: ${data.refresh_token.substring(0, 8)}...`);
      } else {
        console.log('   ❌ No refresh token in response');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 2: Verify refresh token persisted in DB =====
    console.log('\n2️⃣  Testing refresh token persistence...');
    try {
      const refreshTokens = await prisma.refreshToken.findMany({
        where: { user_id: createdUserId },
      });

      if (refreshTokens.length > 0) {
        console.log('   ✅ Refresh token persisted in database');
        
        const token = refreshTokens[0];
        
        if (token.user_id === createdUserId) {
          console.log('   ✅ user_id matches');
        } else {
          console.log('   ❌ user_id mismatch');
          allTestsPassed = false;
        }

        if (token.expires_at) {
          const now = new Date();
          const expiresAt = new Date(token.expires_at);
          const daysUntilExpiry = Math.round((expiresAt - now) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry >= 6 && daysUntilExpiry <= 7) {
            console.log(`   ✅ expires_at is ~7 days from now (${daysUntilExpiry} days)`);
          } else {
            console.log(`   ⚠️  expires_at is ${daysUntilExpiry} days from now`);
          }
        } else {
          console.log('   ❌ expires_at not set');
          allTestsPassed = false;
        }

        if (token.revoked === false) {
          console.log('   ✅ revoked is false');
        } else {
          console.log('   ❌ revoked should be false');
          allTestsPassed = false;
        }
      } else {
        console.log('   ❌ No refresh token found in database');
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 3: Invalid email (user not found) =====
    console.log('\n3️⃣  Testing login with invalid email (should return 401)...');
    try {
      const { status, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        }),
      });

      log(`Invalid email response: ${status} - ${JSON.stringify(data)}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for invalid email');
      } else {
        console.log(`   ❌ Expected status 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected error.code AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 4: Invalid password =====
    console.log('\n4️⃣  Testing login with invalid password (should return 401)...');
    try {
      const { status, data } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          email: testUser.email,
          password: 'wrongpassword',
        }),
      });

      log(`Invalid password response: ${status} - ${JSON.stringify(data)}`);

      if (status === 401) {
        console.log('   ✅ Status 401 returned for invalid password');
      } else {
        console.log(`   ❌ Expected status 401, got ${status}`);
        allTestsPassed = false;
      }

      if (data.error?.code === 'AUTH_ERROR') {
        console.log('   ✅ error.code is AUTH_ERROR');
      } else {
        console.log(`   ❌ Expected error.code AUTH_ERROR, got ${data.error?.code}`);
        allTestsPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Test error: ${error.message}`);
      allTestsPassed = false;
    }

    // ===== TEST 5: Validation errors =====
    console.log('\n5️⃣  Testing validation errors...');
    try {
      // Missing email
      const { status: status1, data: data1 } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({ password: 'somepassword' }),
      });

      if (status1 === 400 && data1.error?.code === 'VALIDATION_ERROR') {
        console.log('   ✅ Missing email returns 400 VALIDATION_ERROR');
      } else {
        console.log(`   ❌ Missing email: expected 400 VALIDATION_ERROR, got ${status1} ${data1.error?.code}`);
        allTestsPassed = false;
      }

      // Missing password
      const { status: status2, data: data2 } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({ email: testUser.email }),
      });

      if (status2 === 400 && data2.error?.code === 'VALIDATION_ERROR') {
        console.log('   ✅ Missing password returns 400 VALIDATION_ERROR');
      } else {
        console.log(`   ❌ Missing password: expected 400 VALIDATION_ERROR, got ${status2} ${data2.error?.code}`);
        allTestsPassed = false;
      }

      // Invalid email format
      const { status: status3, data: data3 } = await apiRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify({ email: 'not-an-email', password: 'somepassword' }),
      });

      if (status3 === 400 && data3.error?.code === 'VALIDATION_ERROR') {
        console.log('   ✅ Invalid email format returns 400 VALIDATION_ERROR');
      } else {
        console.log(`   ❌ Invalid email format: expected 400 VALIDATION_ERROR, got ${status3} ${data3.error?.code}`);
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
      // Delete refresh tokens first (cascade should handle this, but being explicit)
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
      console.log('✅ All Authentication tests PASSED!');
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
