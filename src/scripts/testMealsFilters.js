/**
 * Test script for Meals Filters
 * Tests date_from, date_to, is_on_diet filters combined with pagination
 * 
 * Run: npm run test:meals-filters
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

  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  }

  return { status: response.status, data };
}

/**
 * Make an authenticated request
 */
async function authRequest(endpoint, options = {}, token = accessToken) {
  const { headers: existingHeaders = {}, ...restOptions } = options;
  
  return apiRequest(endpoint, {
    ...restOptions,
    headers: {
      ...existingHeaders,
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Generate unique email for test
 */
function generateEmail(prefix = 'filters') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

/**
 * Setup: Create test user, login, and create test meals
 */
async function setup() {
  console.log('\n🔧 Setting up test data...\n');

  // Create test user
  const email = generateEmail('filters');
  const password = 'Test123!@#';

  let response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Filters Test User',
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

  // Create test meals with different dates and is_on_diet values
  const testMeals = [
    // January 2024 - on diet
    { name: 'Jan 10 Breakfast', datetime: '2024-01-10T08:00:00.000Z', is_on_diet: true },
    { name: 'Jan 15 Lunch', datetime: '2024-01-15T12:00:00.000Z', is_on_diet: true },
    { name: 'Jan 20 Dinner', datetime: '2024-01-20T19:00:00.000Z', is_on_diet: true },
    // January 2024 - off diet
    { name: 'Jan 12 Snack', datetime: '2024-01-12T15:00:00.000Z', is_on_diet: false },
    { name: 'Jan 18 Pizza', datetime: '2024-01-18T20:00:00.000Z', is_on_diet: false },
    // February 2024 - mixed
    { name: 'Feb 05 Salad', datetime: '2024-02-05T12:00:00.000Z', is_on_diet: true },
    { name: 'Feb 10 Burger', datetime: '2024-02-10T13:00:00.000Z', is_on_diet: false },
    { name: 'Feb 15 Healthy', datetime: '2024-02-15T18:00:00.000Z', is_on_diet: true },
    // March 2024
    { name: 'Mar 01 Breakfast', datetime: '2024-03-01T08:00:00.000Z', is_on_diet: true },
    { name: 'Mar 15 Cheat Day', datetime: '2024-03-15T12:00:00.000Z', is_on_diet: false },
  ];

  for (const meal of testMeals) {
    response = await authRequest('/meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
    if (response.status === 201) {
      createdMealIds.push(response.data.meal.id);
    } else {
      console.error(`Failed to create meal: ${JSON.stringify(response.data)}`);
    }
  }

  console.log(`✅ Created ${createdMealIds.length} test meals\n`);
}

/**
 * Test results tracking
 */
const results = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
  }
}

// ==================== TESTS ====================

/**
 * Test 1: Filter by date_from only
 */
async function testDateFromOnly() {
  const response = await authRequest('/meals?date_from=2024-02-01', { method: 'GET' });

  // Should return Feb and Mar meals (5 meals: Feb 05, Feb 10, Feb 15, Mar 01, Mar 15)
  const passed = response.status === 200 &&
    response.data.data.length === 5 &&
    response.data.data.every(m => new Date(m.datetime) >= new Date('2024-02-01'));

  logTest(
    'Test 1: Filter by date_from only (>=2024-02-01)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 5` : ''
  );
}

/**
 * Test 2: Filter by date_to only
 */
async function testDateToOnly() {
  const response = await authRequest('/meals?date_to=2024-01-31', { method: 'GET' });

  // Should return only January meals (5 meals)
  const passed = response.status === 200 &&
    response.data.data.length === 5 &&
    response.data.data.every(m => new Date(m.datetime) <= new Date('2024-01-31T23:59:59.999Z'));

  logTest(
    'Test 2: Filter by date_to only (<=2024-01-31)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 5` : ''
  );
}

/**
 * Test 3: Filter by date range (date_from and date_to)
 */
async function testDateRange() {
  const response = await authRequest('/meals?date_from=2024-01-15&date_to=2024-02-10', { method: 'GET' });

  // Should return meals from Jan 15 to Feb 10 (6 meals: Jan 15, 18, 20, Feb 05, 10)
  // Jan 15, Jan 18, Jan 20, Feb 05, Feb 10 = 5 meals
  const passed = response.status === 200 &&
    response.data.data.length === 5 &&
    response.data.data.every(m => {
      const date = new Date(m.datetime);
      return date >= new Date('2024-01-15') && date <= new Date('2024-02-10T23:59:59.999Z');
    });

  logTest(
    'Test 3: Filter by date range (2024-01-15 to 2024-02-10)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 5` : ''
  );
}

/**
 * Test 4: Filter by is_on_diet=true
 */
async function testIsOnDietTrue() {
  const response = await authRequest('/meals?is_on_diet=true', { method: 'GET' });

  // Should return only on-diet meals (6 meals)
  const passed = response.status === 200 &&
    response.data.data.length === 6 &&
    response.data.data.every(m => m.is_on_diet === true);

  logTest(
    'Test 4: Filter by is_on_diet=true',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 6` : ''
  );
}

/**
 * Test 5: Filter by is_on_diet=false
 */
async function testIsOnDietFalse() {
  const response = await authRequest('/meals?is_on_diet=false', { method: 'GET' });

  // Should return only off-diet meals (4 meals)
  const passed = response.status === 200 &&
    response.data.data.length === 4 &&
    response.data.data.every(m => m.is_on_diet === false);

  logTest(
    'Test 5: Filter by is_on_diet=false',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 4` : ''
  );
}

/**
 * Test 6: Combined filters - date range + is_on_diet
 */
async function testCombinedFilters() {
  const response = await authRequest('/meals?date_from=2024-01-01&date_to=2024-01-31&is_on_diet=true', { method: 'GET' });

  // Should return on-diet meals in January (3 meals: Jan 10, 15, 20)
  const passed = response.status === 200 &&
    response.data.data.length === 3 &&
    response.data.data.every(m => m.is_on_diet === true);

  logTest(
    'Test 6: Combined filters (Jan 2024 + is_on_diet=true)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Expected: 3` : ''
  );
}

/**
 * Test 7: Filters with pagination
 */
async function testFiltersWithPagination() {
  const response = await authRequest('/meals?is_on_diet=true&page=1&limit=2', { method: 'GET' });

  // Should return first 2 on-diet meals with correct pagination
  const passed = response.status === 200 &&
    response.data.data.length === 2 &&
    response.data.pagination.page === 1 &&
    response.data.pagination.limit === 2 &&
    response.data.pagination.total === 6 &&
    response.data.pagination.totalPages === 3 &&
    response.data.pagination.hasNext === true;

  logTest(
    'Test 7: Filters with pagination (is_on_diet=true, page=1, limit=2)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data.pagination)}` : ''
  );
}

/**
 * Test 8: Filters with pagination - page 2
 */
async function testFiltersWithPaginationPage2() {
  const response = await authRequest('/meals?is_on_diet=true&page=2&limit=2', { method: 'GET' });

  // Should return page 2 of on-diet meals
  const passed = response.status === 200 &&
    response.data.data.length === 2 &&
    response.data.pagination.page === 2 &&
    response.data.pagination.hasPrev === true &&
    response.data.pagination.hasNext === true;

  logTest(
    'Test 8: Filters with pagination page 2',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data.pagination)}` : ''
  );
}

/**
 * Test 9: Empty result with filters
 */
async function testEmptyResultWithFilters() {
  const response = await authRequest('/meals?date_from=2025-01-01&date_to=2025-12-31', { method: 'GET' });

  // Should return empty array for future dates
  const passed = response.status === 200 &&
    response.data.data.length === 0 &&
    response.data.pagination.total === 0;

  logTest(
    'Test 9: Empty result with filters (future dates)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}` : ''
  );
}

/**
 * Test 10: Invalid date_from format
 */
async function testInvalidDateFromFormat() {
  const response = await authRequest('/meals?date_from=01-15-2024', { method: 'GET' });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 10: Invalid date_from format (MM-DD-YYYY)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 11: Invalid date_to format
 */
async function testInvalidDateToFormat() {
  const response = await authRequest('/meals?date_to=2024/01/15', { method: 'GET' });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 11: Invalid date_to format (YYYY/MM/DD)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 12: Invalid is_on_diet value
 */
async function testInvalidIsOnDietValue() {
  const response = await authRequest('/meals?is_on_diet=yes', { method: 'GET' });

  // 'yes' should be transformed to undefined and ignored, so it should work
  // Actually, let's check - the transform returns undefined for invalid values
  // and the refine checks if it's undefined or boolean
  // So 'yes' -> undefined -> passes refine -> no filter applied
  const passed = response.status === 200 && response.data.data.length === 10;

  logTest(
    'Test 12: Invalid is_on_diet value (yes) - ignored, returns all',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}` : ''
  );
}

/**
 * Test 13: Ordering preserved with filters
 */
async function testOrderingWithFilters() {
  const response = await authRequest('/meals?is_on_diet=true', { method: 'GET' });

  // Check that meals are ordered by datetime desc
  const meals = response.data.data;
  let isOrdered = true;
  for (let i = 1; i < meals.length; i++) {
    if (new Date(meals[i].datetime) > new Date(meals[i - 1].datetime)) {
      isOrdered = false;
      break;
    }
  }

  const passed = response.status === 200 && isOrdered;

  logTest(
    'Test 13: Ordering preserved with filters (datetime desc)',
    passed,
    !passed ? `Status: ${response.status}, Ordered: ${isOrdered}` : ''
  );
}

/**
 * Test 14: Single day filter (date_from = date_to)
 */
async function testSingleDayFilter() {
  const response = await authRequest('/meals?date_from=2024-01-15&date_to=2024-01-15', { method: 'GET' });

  // Should return only Jan 15 meal
  const passed = response.status === 200 &&
    response.data.data.length === 1 &&
    response.data.data[0].name === 'Jan 15 Lunch';

  logTest(
    'Test 14: Single day filter (2024-01-15)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Name: ${response.data.data?.[0]?.name}` : ''
  );
}

/**
 * Test 15: All filters combined
 */
async function testAllFiltersCombined() {
  const response = await authRequest('/meals?date_from=2024-02-01&date_to=2024-02-28&is_on_diet=false&page=1&limit=10', { method: 'GET' });

  // Should return off-diet meals in February (1 meal: Feb 10 Burger)
  const passed = response.status === 200 &&
    response.data.data.length === 1 &&
    response.data.data[0].name === 'Feb 10 Burger' &&
    response.data.data[0].is_on_diet === false;

  logTest(
    'Test 15: All filters combined (Feb 2024 + is_on_diet=false)',
    passed,
    !passed ? `Status: ${response.status}, Count: ${response.data.data?.length}, Data: ${JSON.stringify(response.data.data)}` : ''
  );
}

// ==================== MAIN ====================

async function runTests() {
  console.log('🔍 Meals Filters Tests\n');
  console.log('='.repeat(50));

  try {
    await setup();

    // Date filters
    await testDateFromOnly();
    await testDateToOnly();
    await testDateRange();
    await testSingleDayFilter();

    // is_on_diet filters
    await testIsOnDietTrue();
    await testIsOnDietFalse();

    // Combined filters
    await testCombinedFilters();
    await testAllFiltersCombined();

    // Filters with pagination
    await testFiltersWithPagination();
    await testFiltersWithPaginationPage2();

    // Edge cases
    await testEmptyResultWithFilters();
    await testInvalidDateFromFormat();
    await testInvalidDateToFormat();
    await testInvalidIsOnDietValue();
    await testOrderingWithFilters();

  } catch (error) {
    console.error('\n💥 Test setup failed:', error.message);
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    console.log('Failed tests:');
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => console.log(`  - ${t.name}: ${t.details}`));
    process.exit(1);
  }

  console.log('🎉 All tests passed!\n');
}

runTests();
