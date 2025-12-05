/**
 * Vitest Test Setup
 * Runs before all tests
 */

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';

// Mock logger to avoid noise during tests
vi.mock('../src/config/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

beforeAll(async () => {
  // Setup code that runs once before all tests
});

afterAll(async () => {
  // Cleanup code that runs once after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});
