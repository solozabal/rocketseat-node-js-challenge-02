/**
 * Test script for Metrics endpoint
 * Tests total_meals, total_on_diet, total_off_diet, best_streak
 * 
 * Run: npm run test:metrics
 */

const BASE_URL = 'http://localhost:3000/v1';

// Test state
let accessToken = null;
let testUserId = null;
let createdMealIds = [];

/**
 * Make an API request
 */
async function apiRequest(endpoint, options = {}) {
  const { headers: customHeaders = {}, ...restOptions } = options;

  const finalHeaders = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: finalHeaders,
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data };
}

/**
 * Make an authenticated request
 */
async function authRequest(endpoint, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * Generate unique email
 */
function generateEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

/**
 * Setup: Create test user and login
 */
async function setup() {
  console.log('\n🔧 Setting up test user...\n');

  // Create test user
  const email = generateEmail('metrics');
  const password = 'Test123!@#';

  let response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Metrics Test User',
      email,
      password,
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create user: ${JSON.stringify(response.data)}`);
  }
  testUserId = response.data.user.id;

  // Login
  response = await apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to login: ${JSON.stringify(response.data)}`);
  }
  accessToken = response.data.token;

  console.log('✅ Test user created and logged in\n');
}

/**
 * Create meals with specific patterns for testing
 */
async function createMeals(mealsList) {
  const ids = [];
  for (const meal of mealsList) {
    const response = await authRequest('/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
    if (response.status === 201) {
      ids.push(response.data.meal.id);
    }
  }
  createdMealIds.push(...ids);
  return ids;
}

/**
 * Delete all created meals
 */
async function cleanupMeals() {
  for (const id of createdMealIds) {
    await authRequest(`/meals/${id}`, { method: 'DELETE' });
  }
  createdMealIds = [];
}

/**
 * Get metrics
 */
async function getMetrics() {
  return authRequest('/metrics');
}

// Test results
let passed = 0;
let failed = 0;

function logResult(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

/**
 * Test 1: No meals - all zeros
 */
async function testNoMeals() {
  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 0 &&
    response.data.total_on_diet === 0 &&
    response.data.total_off_diet === 0 &&
    response.data.best_streak === 0;

  logResult(
    'Test 1: No meals - all zeros',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 2: Single meal on diet
 */
async function testSingleMealOnDiet() {
  await createMeals([
    { name: 'Salad', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 1 &&
    response.data.total_on_diet === 1 &&
    response.data.total_off_diet === 0 &&
    response.data.best_streak === 1;

  logResult(
    'Test 2: Single meal on diet (streak=1)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 3: Single meal off diet
 */
async function testSingleMealOffDiet() {
  await createMeals([
    { name: 'Pizza', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: false },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 1 &&
    response.data.total_on_diet === 0 &&
    response.data.total_off_diet === 1 &&
    response.data.best_streak === 0;

  logResult(
    'Test 3: Single meal off diet (streak=0)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 4: Multiple meals all on diet - streak equals total
 */
async function testAllOnDiet() {
  await createMeals([
    { name: 'Breakfast', datetime: '2024-01-10T08:00:00.000Z', is_on_diet: true },
    { name: 'Lunch', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    { name: 'Dinner', datetime: '2024-01-10T19:00:00.000Z', is_on_diet: true },
    { name: 'Next Day', datetime: '2024-01-11T08:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 4 &&
    response.data.total_on_diet === 4 &&
    response.data.total_off_diet === 0 &&
    response.data.best_streak === 4;

  logResult(
    'Test 4: All meals on diet (streak=4)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 5: Multiple meals all off diet - streak is 0
 */
async function testAllOffDiet() {
  await createMeals([
    { name: 'Pizza', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: false },
    { name: 'Burger', datetime: '2024-01-11T12:00:00.000Z', is_on_diet: false },
    { name: 'Fries', datetime: '2024-01-12T12:00:00.000Z', is_on_diet: false },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 3 &&
    response.data.total_on_diet === 0 &&
    response.data.total_off_diet === 3 &&
    response.data.best_streak === 0;

  logResult(
    'Test 5: All meals off diet (streak=0)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 6: Streak broken by off-diet meal
 */
async function testStreakBroken() {
  // Pattern: on, on, on, OFF, on, on
  // Best streak should be 3 (first sequence)
  await createMeals([
    { name: 'Meal 1', datetime: '2024-01-10T08:00:00.000Z', is_on_diet: true },
    { name: 'Meal 2', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 3', datetime: '2024-01-10T18:00:00.000Z', is_on_diet: true },
    { name: 'Cheat', datetime: '2024-01-11T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 5', datetime: '2024-01-12T08:00:00.000Z', is_on_diet: true },
    { name: 'Meal 6', datetime: '2024-01-12T12:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 6 &&
    response.data.total_on_diet === 5 &&
    response.data.total_off_diet === 1 &&
    response.data.best_streak === 3;

  logResult(
    'Test 6: Streak broken (on,on,on,OFF,on,on -> best=3)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 7: Best streak at the end
 */
async function testStreakAtEnd() {
  // Pattern: on, OFF, on, on, on, on
  // Best streak should be 4 (last sequence)
  await createMeals([
    { name: 'Meal 1', datetime: '2024-01-10T08:00:00.000Z', is_on_diet: true },
    { name: 'Cheat', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 3', datetime: '2024-01-11T08:00:00.000Z', is_on_diet: true },
    { name: 'Meal 4', datetime: '2024-01-11T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 5', datetime: '2024-01-11T18:00:00.000Z', is_on_diet: true },
    { name: 'Meal 6', datetime: '2024-01-12T08:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 6 &&
    response.data.total_on_diet === 5 &&
    response.data.total_off_diet === 1 &&
    response.data.best_streak === 4;

  logResult(
    'Test 7: Best streak at end (on,OFF,on,on,on,on -> best=4)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 8: Multiple streaks - first wins on tie
 */
async function testTieFirstWins() {
  // Pattern: on, on, on, OFF, on, on, on
  // Two streaks of 3 - first should win (both are 3)
  await createMeals([
    { name: 'Meal 1', datetime: '2024-01-10T08:00:00.000Z', is_on_diet: true },
    { name: 'Meal 2', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 3', datetime: '2024-01-10T18:00:00.000Z', is_on_diet: true },
    { name: 'Cheat', datetime: '2024-01-11T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 5', datetime: '2024-01-12T08:00:00.000Z', is_on_diet: true },
    { name: 'Meal 6', datetime: '2024-01-12T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 7', datetime: '2024-01-12T18:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  // Best streak is 3 (first sequence wins on tie)
  const success =
    response.status === 200 &&
    response.data.total_meals === 7 &&
    response.data.total_on_diet === 6 &&
    response.data.total_off_diet === 1 &&
    response.data.best_streak === 3;

  logResult(
    'Test 8: Tie - first sequence wins (on,on,on,OFF,on,on,on -> best=3)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 9: Days without meals don't break streak
 */
async function testDaysWithoutMeals() {
  // Meals on different days with gaps - streak should continue
  await createMeals([
    { name: 'Day 1', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    // No meal on Jan 11
    { name: 'Day 3', datetime: '2024-01-12T12:00:00.000Z', is_on_diet: true },
    // No meal on Jan 13, 14, 15
    { name: 'Day 7', datetime: '2024-01-16T12:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  // Streak should be 3 - days without meals don't break it
  const success =
    response.status === 200 &&
    response.data.total_meals === 3 &&
    response.data.total_on_diet === 3 &&
    response.data.total_off_diet === 0 &&
    response.data.best_streak === 3;

  logResult(
    'Test 9: Days without meals dont break streak (gap days -> streak=3)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 10: Complex pattern
 */
async function testComplexPattern() {
  // Pattern: OFF, on, on, OFF, on, on, on, on, OFF, on
  // Best streak should be 4 (middle sequence)
  await createMeals([
    { name: 'Meal 1', datetime: '2024-01-01T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 2', datetime: '2024-01-02T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 3', datetime: '2024-01-03T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 4', datetime: '2024-01-04T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 5', datetime: '2024-01-05T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 6', datetime: '2024-01-06T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 7', datetime: '2024-01-07T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 8', datetime: '2024-01-08T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 9', datetime: '2024-01-09T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 10', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  const success =
    response.status === 200 &&
    response.data.total_meals === 10 &&
    response.data.total_on_diet === 7 &&
    response.data.total_off_diet === 3 &&
    response.data.best_streak === 4;

  logResult(
    'Test 10: Complex pattern (OFF,on,on,OFF,on,on,on,on,OFF,on -> best=4)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 11: Alternating pattern (no streak)
 */
async function testAlternating() {
  // Pattern: on, OFF, on, OFF, on, OFF
  await createMeals([
    { name: 'Meal 1', datetime: '2024-01-01T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 2', datetime: '2024-01-02T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 3', datetime: '2024-01-03T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 4', datetime: '2024-01-04T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal 5', datetime: '2024-01-05T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal 6', datetime: '2024-01-06T12:00:00.000Z', is_on_diet: false },
  ]);

  const response = await getMetrics();

  // Best streak is 1 (each on-diet meal is followed by off-diet)
  const success =
    response.status === 200 &&
    response.data.total_meals === 6 &&
    response.data.total_on_diet === 3 &&
    response.data.total_off_diet === 3 &&
    response.data.best_streak === 1;

  logResult(
    'Test 11: Alternating (on,OFF,on,OFF,on,OFF -> best=1)',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Test 12: Unauthenticated request
 */
async function testUnauthenticated() {
  const response = await apiRequest('/metrics');

  const success = response.status === 401;

  logResult(
    'Test 12: Unauthenticated request returns 401',
    success,
    !success ? `Status: ${response.status}` : ''
  );
}

/**
 * Test 13: Multiple meals same datetime (order preserved)
 */
async function testSameDatetime() {
  // Multiple meals at exact same time - should still count correctly
  await createMeals([
    { name: 'Meal A', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal B', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
    { name: 'Meal C', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: false },
    { name: 'Meal D', datetime: '2024-01-10T12:00:00.000Z', is_on_diet: true },
  ]);

  const response = await getMetrics();

  // 4 meals, 3 on diet, 1 off diet
  // Streak depends on order - at least 1 or 2 depending on DB ordering
  const success =
    response.status === 200 &&
    response.data.total_meals === 4 &&
    response.data.total_on_diet === 3 &&
    response.data.total_off_diet === 1;

  logResult(
    'Test 13: Same datetime meals counted correctly',
    success,
    !success ? `Data: ${JSON.stringify(response.data)}` : ''
  );

  await cleanupMeals();
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🔍 Metrics Tests\n');
  console.log('==================================================\n');

  try {
    await setup();

    // Run tests sequentially
    await testNoMeals();
    await testSingleMealOnDiet();
    await testSingleMealOffDiet();
    await testAllOnDiet();
    await testAllOffDiet();
    await testStreakBroken();
    await testStreakAtEnd();
    await testTieFirstWins();
    await testDaysWithoutMeals();
    await testComplexPattern();
    await testAlternating();
    await testUnauthenticated();
    await testSameDatetime();

    console.log('\n==================================================\n');
    console.log(`📊 Results: ${passed} passed, ${failed} failed\n`);

    if (failed === 0) {
      console.log('🎉 All tests passed!\n');
    } else {
      console.log('❌ Some tests failed.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Test setup failed:', error.message);
    process.exit(1);
  }
}

runTests();
