/**
 * Test script for Meals CRUD
 * Tests all CRUD operations with pagination, ordering, and ownership
 * 
 * Run: npm run test:meals
 */

const BASE_URL = 'http://localhost:3000/v1';

// Test state
let accessToken = null;
let accessToken2 = null;
let testUserId = null;
let testUserId2 = null;
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
function generateEmail(prefix = 'meals') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
}

/**
 * Setup: Create test users and get tokens
 */
async function setup() {
  console.log('\n🔧 Setting up test users...\n');

  // Create first test user
  const email1 = generateEmail('meals1');
  const password = 'Test123!@#';

  let response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Meals Test User 1',
      email: email1,
      password,
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create user 1: ${JSON.stringify(response.data)}`);
  }
  testUserId = response.data.user.id;

  // Login first user
  response = await apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify({ email: email1, password }),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to login user 1: ${JSON.stringify(response.data)}`);
  }
  accessToken = response.data.token;

  // Create second test user (for ownership tests)
  const email2 = generateEmail('meals2');

  response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Meals Test User 2',
      email: email2,
      password,
    }),
  });

  if (response.status !== 201) {
    throw new Error(`Failed to create user 2: ${JSON.stringify(response.data)}`);
  }
  testUserId2 = response.data.user.id;

  // Login second user
  response = await apiRequest('/sessions', {
    method: 'POST',
    body: JSON.stringify({ email: email2, password }),
  });

  if (response.status !== 200) {
    throw new Error(`Failed to login user 2: ${JSON.stringify(response.data)}`);
  }
  accessToken2 = response.data.token;

  console.log('✅ Test users created and authenticated\n');
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
 * Test 1: Create meal - valid data
 */
async function testCreateMealValid() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Breakfast',
      description: 'Healthy breakfast with fruits',
      datetime: '2024-01-15T08:00:00.000Z',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 201 &&
    response.data.meal &&
    response.data.meal.name === 'Breakfast' &&
    response.data.meal.is_on_diet === true &&
    response.data.meal.id;

  if (passed) {
    createdMealIds.push(response.data.meal.id);
  }

  logTest(
    'Test 1: Create meal with valid data',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 2: Create meal - without description (optional)
 */
async function testCreateMealWithoutDescription() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Quick Snack',
      datetime: '2024-01-15T15:00:00.000Z',
      is_on_diet: false,
    }),
  });

  const passed = response.status === 201 &&
    response.data.meal &&
    response.data.meal.name === 'Quick Snack' &&
    response.data.meal.description === null;

  if (passed) {
    createdMealIds.push(response.data.meal.id);
  }

  logTest(
    'Test 2: Create meal without description (optional)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 3: Create meal - validation error (missing name)
 */
async function testCreateMealMissingName() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 3: Create meal - validation error (missing name)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 4: Create meal - validation error (invalid datetime)
 */
async function testCreateMealInvalidDatetime() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Invalid Meal',
      datetime: 'not-a-date',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 4: Create meal - validation error (invalid datetime)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 5: Create meal - requires authentication
 */
async function testCreateMealRequiresAuth() {
  const response = await apiRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Unauthorized Meal',
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 401;

  logTest(
    'Test 5: Create meal - requires authentication',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 6: List meals - default pagination
 */
async function testListMealsDefaultPagination() {
  const response = await authRequest('/meals', { method: 'GET' });

  const passed = response.status === 200 &&
    response.data.data &&
    Array.isArray(response.data.data) &&
    response.data.pagination &&
    response.data.pagination.page === 1 &&
    response.data.pagination.limit === 20;

  logTest(
    'Test 6: List meals - default pagination',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 7: List meals - custom pagination
 */
async function testListMealsCustomPagination() {
  const response = await authRequest('/meals?page=1&limit=5', { method: 'GET' });

  const passed = response.status === 200 &&
    response.data.pagination.page === 1 &&
    response.data.pagination.limit === 5;

  logTest(
    'Test 7: List meals - custom pagination',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 8: List meals - ordered by datetime desc
 */
async function testListMealsOrderedByDatetime() {
  // Create meals with different datetimes
  const meal1 = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Older Meal',
      datetime: '2024-01-10T12:00:00.000Z',
      is_on_diet: true,
    }),
  });
  createdMealIds.push(meal1.data.meal.id);

  const meal2 = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Newer Meal',
      datetime: '2024-01-20T12:00:00.000Z',
      is_on_diet: true,
    }),
  });
  createdMealIds.push(meal2.data.meal.id);

  const response = await authRequest('/meals', { method: 'GET' });

  // Check that meals are ordered by datetime desc (newer first)
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
    'Test 8: List meals - ordered by datetime desc',
    passed,
    !passed ? `Status: ${response.status}, Order check: ${isOrdered}` : ''
  );
}

/**
 * Test 9: List meals - invalid page parameter
 */
async function testListMealsInvalidPage() {
  const response = await authRequest('/meals?page=-1', { method: 'GET' });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 9: List meals - invalid page parameter',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 10: List meals - limit exceeds max (100)
 */
async function testListMealsLimitExceedsMax() {
  const response = await authRequest('/meals?limit=150', { method: 'GET' });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 10: List meals - limit exceeds max (100)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 11: Get meal by ID - success
 */
async function testGetMealByIdSuccess() {
  const mealId = createdMealIds[0];
  const response = await authRequest(`/meals/${mealId}`, { method: 'GET' });

  const passed = response.status === 200 &&
    response.data.meal &&
    response.data.meal.id === mealId;

  logTest(
    'Test 11: Get meal by ID - success',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 12: Get meal by ID - not found
 */
async function testGetMealByIdNotFound() {
  const response = await authRequest('/meals/00000000-0000-0000-0000-000000000000', { method: 'GET' });

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 12: Get meal by ID - not found',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 13: Get meal by ID - invalid UUID
 */
async function testGetMealByIdInvalidUuid() {
  const response = await authRequest('/meals/not-a-uuid', { method: 'GET' });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 13: Get meal by ID - invalid UUID',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 14: Get meal by ID - ownership (user 2 cannot see user 1's meal)
 */
async function testGetMealByIdOwnership() {
  const mealId = createdMealIds[0]; // Meal created by user 1
  const response = await authRequest(`/meals/${mealId}`, { method: 'GET' }, accessToken2);

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 14: Get meal by ID - ownership check (404 for other user)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 15: Update meal - all fields
 */
async function testUpdateMealAllFields() {
  const mealId = createdMealIds[0];
  const response = await authRequest(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Updated Breakfast',
      description: 'Updated description',
      datetime: '2024-01-16T09:00:00.000Z',
      is_on_diet: false,
    }),
  });

  const passed = response.status === 200 &&
    response.data.meal &&
    response.data.meal.name === 'Updated Breakfast' &&
    response.data.meal.description === 'Updated description' &&
    response.data.meal.is_on_diet === false;

  logTest(
    'Test 15: Update meal - all fields',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 16: Update meal - partial update (only name)
 */
async function testUpdateMealPartial() {
  const mealId = createdMealIds[0];
  const response = await authRequest(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Partially Updated',
    }),
  });

  const passed = response.status === 200 &&
    response.data.meal &&
    response.data.meal.name === 'Partially Updated';

  logTest(
    'Test 16: Update meal - partial update (only name)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 17: Update meal - empty body (no changes)
 */
async function testUpdateMealEmptyBody() {
  const mealId = createdMealIds[0];
  const response = await authRequest(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });

  const passed = response.status === 200 && response.data.meal;

  logTest(
    'Test 17: Update meal - empty body (no changes)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 18: Update meal - not found
 */
async function testUpdateMealNotFound() {
  const response = await authRequest('/meals/00000000-0000-0000-0000-000000000000', {
    method: 'PUT',
    body: JSON.stringify({ name: 'Should Fail' }),
  });

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 18: Update meal - not found',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 19: Update meal - ownership (user 2 cannot update user 1's meal)
 */
async function testUpdateMealOwnership() {
  const mealId = createdMealIds[0]; // Meal created by user 1
  const response = await authRequest(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: 'Hacked!' }),
  }, accessToken2);

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 19: Update meal - ownership check (404 for other user)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 20: Update meal - validation error (empty name)
 */
async function testUpdateMealValidationError() {
  const mealId = createdMealIds[0];
  const response = await authRequest(`/meals/${mealId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: '' }),
  });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 20: Update meal - validation error (empty name)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 21: Delete meal - success
 */
async function testDeleteMealSuccess() {
  // Create a meal to delete
  const createResponse = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'To Be Deleted',
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  });
  const mealId = createResponse.data.meal.id;

  const response = await authRequest(`/meals/${mealId}`, { method: 'DELETE' });

  // Verify it's deleted
  const getResponse = await authRequest(`/meals/${mealId}`, { method: 'GET' });

  const passed = response.status === 204 && getResponse.status === 404;

  logTest(
    'Test 21: Delete meal - success (204 and cannot find after)',
    passed,
    !passed ? `Delete status: ${response.status}, Get status: ${getResponse.status}` : ''
  );
}

/**
 * Test 22: Delete meal - not found
 */
async function testDeleteMealNotFound() {
  const response = await authRequest('/meals/00000000-0000-0000-0000-000000000000', { method: 'DELETE' });

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 22: Delete meal - not found',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 23: Delete meal - ownership (user 2 cannot delete user 1's meal)
 */
async function testDeleteMealOwnership() {
  const mealId = createdMealIds[0]; // Meal created by user 1
  const response = await authRequest(`/meals/${mealId}`, { method: 'DELETE' }, accessToken2);

  const passed = response.status === 404 &&
    response.data.error &&
    response.data.error.code === 'NOT_FOUND';

  logTest(
    'Test 23: Delete meal - ownership check (404 for other user)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 24: List meals - only shows user's own meals
 */
async function testListMealsOwnership() {
  // Create a meal for user 2
  await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'User 2 Meal',
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  }, accessToken2);

  // List meals for user 1
  const response1 = await authRequest('/meals', { method: 'GET' });

  // Check that user 1's list doesn't contain user 2's meal
  const hasUser2Meal = response1.data.data.some(m => m.name === 'User 2 Meal');

  const passed = response1.status === 200 && !hasUser2Meal;

  logTest(
    'Test 24: List meals - only shows user\'s own meals',
    passed,
    !passed ? `Found User 2 Meal: ${hasUser2Meal}` : ''
  );
}

/**
 * Test 25: Create meal - name too long (>100 chars)
 */
async function testCreateMealNameTooLong() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'A'.repeat(101),
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 25: Create meal - name too long (>100 chars)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

/**
 * Test 26: Create meal - description too long (>500 chars)
 */
async function testCreateMealDescriptionTooLong() {
  const response = await authRequest('/meals', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Valid Name',
      description: 'A'.repeat(501),
      datetime: '2024-01-15T12:00:00.000Z',
      is_on_diet: true,
    }),
  });

  const passed = response.status === 400 &&
    response.data.error &&
    response.data.error.code === 'VALIDATION_ERROR';

  logTest(
    'Test 26: Create meal - description too long (>500 chars)',
    passed,
    !passed ? `Status: ${response.status}, Data: ${JSON.stringify(response.data)}` : ''
  );
}

// ==================== MAIN ====================

async function runTests() {
  console.log('🍽️  Meals CRUD Tests\n');
  console.log('='.repeat(50));

  try {
    await setup();

    // Create tests
    await testCreateMealValid();
    await testCreateMealWithoutDescription();
    await testCreateMealMissingName();
    await testCreateMealInvalidDatetime();
    await testCreateMealRequiresAuth();
    await testCreateMealNameTooLong();
    await testCreateMealDescriptionTooLong();

    // List tests
    await testListMealsDefaultPagination();
    await testListMealsCustomPagination();
    await testListMealsOrderedByDatetime();
    await testListMealsInvalidPage();
    await testListMealsLimitExceedsMax();
    await testListMealsOwnership();

    // Get by ID tests
    await testGetMealByIdSuccess();
    await testGetMealByIdNotFound();
    await testGetMealByIdInvalidUuid();
    await testGetMealByIdOwnership();

    // Update tests
    await testUpdateMealAllFields();
    await testUpdateMealPartial();
    await testUpdateMealEmptyBody();
    await testUpdateMealNotFound();
    await testUpdateMealOwnership();
    await testUpdateMealValidationError();

    // Delete tests
    await testDeleteMealSuccess();
    await testDeleteMealNotFound();
    await testDeleteMealOwnership();

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
