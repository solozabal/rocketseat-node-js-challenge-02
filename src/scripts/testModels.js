/**
 * Database Models Test Script
 * Validates User, Meal and RefreshToken models with cascade delete
 *
 * Usage: npm run db:test-models
 */

require('dotenv').config();

const logger = require('../config/logger');
const { prisma, disconnectPrisma } = require('../config/database');

const requestId = `models-test-${Date.now()}`;

const log = (message, data = {}) => {
  logger.info({ request_id: requestId, type: 'models_test', message, ...data });
};

const logError = (message, error) => {
  logger.error({
    request_id: requestId,
    type: 'models_test',
    message,
    error: error.message,
  });
};

const testModels = async () => {
  console.log('\n🧪 Starting database models test...\n');
  log('Starting database models test');

  let testUserId = null;

  try {
    // ==================== TEST 1: Create User ====================
    console.log('1️⃣  Testing User creation...');
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password_hash: 'hashed_password_here',
      },
    });
    testUserId = user.id;
    console.log(`   ✅ User created: ${user.id}`);
    log('User created successfully', { userId: user.id });

    // ==================== TEST 2: Create Meals ====================
    console.log('2️⃣  Testing Meal creation...');
    const meal1 = await prisma.meal.create({
      data: {
        user_id: user.id,
        name: 'Healthy Breakfast',
        description: 'Oatmeal with fruits and honey',
        datetime: new Date(),
        is_on_diet: true,
      },
    });
    console.log(`   ✅ Meal 1 created: ${meal1.id} (on diet: ${meal1.is_on_diet})`);

    const meal2 = await prisma.meal.create({
      data: {
        user_id: user.id,
        name: 'Pizza Night',
        description: null, // Testing optional field
        datetime: new Date(),
        is_on_diet: false,
      },
    });
    console.log(`   ✅ Meal 2 created: ${meal2.id} (on diet: ${meal2.is_on_diet})`);
    log('Meals created successfully', { mealIds: [meal1.id, meal2.id] });

    // ==================== TEST 3: Create RefreshToken ====================
    console.log('3️⃣  Testing RefreshToken creation...');
    const refreshToken = await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: `refresh_token_${Date.now()}`,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        revoked: false,
      },
    });
    console.log(`   ✅ RefreshToken created: ${refreshToken.id}`);
    log('RefreshToken created successfully', { tokenId: refreshToken.id });

    // ==================== TEST 4: Query with Relations ====================
    console.log('4️⃣  Testing relations query...');
    const userWithRelations = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        meals: true,
        refresh_tokens: true,
      },
    });
    console.log(`   ✅ User has ${userWithRelations.meals.length} meals`);
    console.log(`   ✅ User has ${userWithRelations.refresh_tokens.length} refresh tokens`);
    log('Relations query successful', {
      mealsCount: userWithRelations.meals.length,
      tokensCount: userWithRelations.refresh_tokens.length,
    });

    // ==================== TEST 5: Test Index (query by user_id + datetime) ====================
    console.log('5️⃣  Testing index query (user_id + datetime)...');
    const mealsQuery = await prisma.meal.findMany({
      where: {
        user_id: user.id,
        datetime: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { datetime: 'desc' },
    });
    console.log(`   ✅ Index query returned ${mealsQuery.length} meals`);
    log('Index query successful', { mealsCount: mealsQuery.length });

    // ==================== TEST 6: Test Cascade Delete ====================
    console.log('6️⃣  Testing CASCADE delete...');
    
    // Count before delete
    const mealsBeforeDelete = await prisma.meal.count({ where: { user_id: user.id } });
    const tokensBeforeDelete = await prisma.refreshToken.count({ where: { user_id: user.id } });
    console.log(`   📊 Before delete: ${mealsBeforeDelete} meals, ${tokensBeforeDelete} tokens`);

    // Delete user (should cascade to meals and refresh_tokens)
    await prisma.user.delete({ where: { id: user.id } });
    testUserId = null; // User already deleted
    console.log('   🗑️  User deleted');

    // Count after delete
    const mealsAfterDelete = await prisma.meal.count({ where: { user_id: user.id } });
    const tokensAfterDelete = await prisma.refreshToken.count({ where: { user_id: user.id } });
    console.log(`   📊 After delete: ${mealsAfterDelete} meals, ${tokensAfterDelete} tokens`);

    if (mealsAfterDelete === 0 && tokensAfterDelete === 0) {
      console.log('   ✅ CASCADE delete working correctly!');
      log('CASCADE delete verified successfully');
    } else {
      throw new Error('CASCADE delete failed - orphan records found');
    }

    // ==================== ALL TESTS PASSED ====================
    console.log('\n✅ All database model tests PASSED!\n');
    log('All database model tests passed');
    return true;

  } catch (error) {
    console.error('\n❌ Database model test FAILED!\n');
    console.error('Error:', error.message);
    logError('Database model test failed', error);

    // Cleanup on failure
    if (testUserId) {
      try {
        await prisma.user.delete({ where: { id: testUserId } });
        console.log('🧹 Cleanup: Test user deleted');
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    return false;
  } finally {
    await disconnectPrisma();
    log('Database connection closed');
  }
};

// Run the test
testModels()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
