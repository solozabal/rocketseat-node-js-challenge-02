/**
 * Validation and Error Middleware Test Script
 * Tests Zod validators and error response envelope
 *
 * Usage: npm run test:validation
 */

const logger = require('../config/logger');

// Import validators
const {
  createUserSchema,
  updateUserSchema,
  createMealSchema,
  updateMealSchema,
  loginSchema,
  refreshTokenSchema,
} = require('../validators');

// Import errors
const { AppError, ErrorCodes } = require('../errors');

const requestId = `validation-test-${Date.now()}`;

const log = (message, data = {}) => {
  console.log(`   ${message}`);
  logger.info({ request_id: requestId, type: 'validation_test', message, ...data });
};

const logSuccess = (message) => {
  console.log(`   ✅ ${message}`);
};

const logError = (message) => {
  console.log(`   ❌ ${message}`);
};

// Helper to test validation
const testValidation = (schemaName, schema, validData, invalidData) => {
  console.log(`\n📋 Testing ${schemaName}...`);

  let passed = true;

  // Test valid data
  try {
    const result = schema.parse(validData);
    logSuccess(`Valid data accepted`);
    log('Parsed result', { result });
  } catch (error) {
    logError(`Valid data rejected: ${error.message}`);
    passed = false;
  }

  // Test invalid data cases
  for (const [caseName, data] of Object.entries(invalidData)) {
    try {
      schema.parse(data);
      logError(`Invalid data (${caseName}) was accepted - should have been rejected`);
      passed = false;
    } catch (error) {
      logSuccess(`Invalid data (${caseName}) correctly rejected`);
      const details = error.errors?.map((e) => `${e.path.join('.')}: ${e.message}`);
      log(`Validation errors: ${details?.join(', ')}`);
    }
  }

  return passed;
};

const runTests = async () => {
  console.log('\n🧪 Starting validation and error middleware tests...\n');
  logger.info({ request_id: requestId, type: 'validation_test', message: 'Starting tests' });

  let allPassed = true;

  // ==================== TEST 1: User Validators ====================
  console.log('\n═══════════════════════════════════════');
  console.log('1️⃣  USER VALIDATORS');
  console.log('═══════════════════════════════════════');

  // Create User
  const userCreatePassed = testValidation(
    'createUserSchema',
    createUserSchema,
    { name: 'John Doe', email: 'john@example.com', password: 'secret123' },
    {
      'missing name': { email: 'john@example.com', password: 'secret123' },
      'name too short': { name: 'J', email: 'john@example.com', password: 'secret123' },
      'name too long': { name: 'A'.repeat(101), email: 'john@example.com', password: 'secret123' },
      'invalid email': { name: 'John', email: 'not-an-email', password: 'secret123' },
      'password too short': { name: 'John', email: 'john@example.com', password: '12345' },
    }
  );
  allPassed = allPassed && userCreatePassed;

  // Update User
  const userUpdatePassed = testValidation(
    'updateUserSchema',
    updateUserSchema,
    { name: 'Jane Doe' },
    {
      'name too short': { name: 'J' },
      'invalid email': { email: 'not-an-email' },
      'password too short': { password: '12345' },
    }
  );
  allPassed = allPassed && userUpdatePassed;

  // ==================== TEST 2: Meal Validators ====================
  console.log('\n═══════════════════════════════════════');
  console.log('2️⃣  MEAL VALIDATORS');
  console.log('═══════════════════════════════════════');

  const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
  const futureDate = new Date(Date.now() + 3600000).toISOString(); // 1 hour ahead

  // Create Meal
  const mealCreatePassed = testValidation(
    'createMealSchema',
    createMealSchema,
    { name: 'Healthy Breakfast', description: 'Oatmeal with fruits', datetime: pastDate, is_on_diet: true },
    {
      'missing name': { description: 'Test', datetime: pastDate, is_on_diet: true },
      'name too long': { name: 'A'.repeat(101), datetime: pastDate, is_on_diet: true },
      'description too long': { name: 'Test', description: 'A'.repeat(501), datetime: pastDate, is_on_diet: true },
      'future datetime': { name: 'Test', datetime: futureDate, is_on_diet: true },
      'invalid datetime': { name: 'Test', datetime: 'not-a-date', is_on_diet: true },
      'missing is_on_diet': { name: 'Test', datetime: pastDate },
      'is_on_diet not boolean': { name: 'Test', datetime: pastDate, is_on_diet: 'yes' },
    }
  );
  allPassed = allPassed && mealCreatePassed;

  // Update Meal
  const mealUpdatePassed = testValidation(
    'updateMealSchema',
    updateMealSchema,
    { name: 'Updated Meal', is_on_diet: false },
    {
      'name too long': { name: 'A'.repeat(101) },
      'description too long': { description: 'A'.repeat(501) },
      'future datetime': { datetime: futureDate },
    }
  );
  allPassed = allPassed && mealUpdatePassed;

  // ==================== TEST 3: Session Validators ====================
  console.log('\n═══════════════════════════════════════');
  console.log('3️⃣  SESSION VALIDATORS');
  console.log('═══════════════════════════════════════');

  // Login
  const loginPassed = testValidation(
    'loginSchema',
    loginSchema,
    { email: 'user@example.com', password: 'secret123' },
    {
      'missing email': { password: 'secret123' },
      'invalid email': { email: 'not-an-email', password: 'secret123' },
      'missing password': { email: 'user@example.com' },
    }
  );
  allPassed = allPassed && loginPassed;

  // Refresh Token
  const refreshPassed = testValidation(
    'refreshTokenSchema',
    refreshTokenSchema,
    { refresh_token: 'some-valid-token' },
    {
      'missing refresh_token': {},
      'empty refresh_token': { refresh_token: '' },
    }
  );
  allPassed = allPassed && refreshPassed;

  // ==================== TEST 4: AppError Class ====================
  console.log('\n═══════════════════════════════════════');
  console.log('4️⃣  APP ERROR CLASS');
  console.log('═══════════════════════════════════════');

  console.log('\n📋 Testing AppError static methods...');

  const errorTests = [
    { method: 'validation', args: ['Invalid input', [{ field: 'email' }]], expectedCode: ErrorCodes.VALIDATION_ERROR, expectedStatus: 400 },
    { method: 'auth', args: ['Invalid token'], expectedCode: ErrorCodes.AUTH_ERROR, expectedStatus: 401 },
    { method: 'forbidden', args: [], expectedCode: ErrorCodes.FORBIDDEN, expectedStatus: 403 },
    { method: 'notFound', args: ['User'], expectedCode: ErrorCodes.NOT_FOUND, expectedStatus: 404 },
    { method: 'conflict', args: ['Email already exists'], expectedCode: ErrorCodes.CONFLICT, expectedStatus: 409 },
    { method: 'rateLimited', args: [], expectedCode: ErrorCodes.RATE_LIMITED, expectedStatus: 429 },
    { method: 'internal', args: [], expectedCode: ErrorCodes.INTERNAL_ERROR, expectedStatus: 500 },
  ];

  for (const test of errorTests) {
    const error = AppError[test.method](...test.args);
    if (error.code === test.expectedCode && error.status === test.expectedStatus) {
      logSuccess(`AppError.${test.method}() → code: ${error.code}, status: ${error.status}`);
    } else {
      logError(`AppError.${test.method}() failed - got code: ${error.code}, status: ${error.status}`);
      allPassed = false;
    }
  }

  // ==================== TEST 5: Error Envelope Format ====================
  console.log('\n═══════════════════════════════════════');
  console.log('5️⃣  ERROR ENVELOPE FORMAT');
  console.log('═══════════════════════════════════════');

  console.log('\n📋 Testing error envelope structure...');

  const testError = AppError.validation('Test validation error', [
    { field: 'email', message: 'Invalid email' },
    { field: 'name', message: 'Name too short' },
  ]);

  const envelope = {
    error: {
      code: testError.code,
      message: testError.message,
      details: testError.details,
      request_id: requestId,
    },
  };

  console.log('\n   Expected envelope structure:');
  console.log(JSON.stringify(envelope, null, 2).split('\n').map(l => '   ' + l).join('\n'));

  if (
    envelope.error.code === ErrorCodes.VALIDATION_ERROR &&
    envelope.error.message === 'Test validation error' &&
    Array.isArray(envelope.error.details) &&
    envelope.error.details.length === 2 &&
    envelope.error.request_id === requestId
  ) {
    logSuccess('Error envelope format is correct');
  } else {
    logError('Error envelope format is incorrect');
    allPassed = false;
  }

  // ==================== SUMMARY ====================
  console.log('\n═══════════════════════════════════════');
  if (allPassed) {
    console.log('✅ All validation and error tests PASSED!');
    console.log('═══════════════════════════════════════\n');
    logger.info({ request_id: requestId, type: 'validation_test', message: 'All tests passed' });
    return true;
  } else {
    console.log('❌ Some tests FAILED!');
    console.log('═══════════════════════════════════════\n');
    logger.error({ request_id: requestId, type: 'validation_test', message: 'Some tests failed' });
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
