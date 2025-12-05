/**
 * Unit tests for error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { AppError, ErrorCodes, ErrorHttpStatus } = require('../../src/errors');
const { errorHandler, notFoundHandler } = require('../../src/middlewares/errorHandler');

// Mock logger
vi.mock('../../src/config/logger', () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}));

describe('AppError', () => {
  describe('constructor', () => {
    it('should create error with code and default message', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND);
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.name).toBe('AppError');
    });

    it('should create error with custom message', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND, 'User not found');
      expect(error.message).toBe('User not found');
    });

    it('should create error with details', () => {
      const details = [{ field: 'email', message: 'Invalid' }];
      const error = new AppError(ErrorCodes.VALIDATION_ERROR, 'Validation failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('static methods', () => {
    it('should create validation error', () => {
      const error = AppError.validation('Invalid input', [{ field: 'name' }]);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toHaveLength(1);
    });

    it('should create auth error', () => {
      const error = AppError.auth('Bad credentials');
      expect(error.code).toBe(ErrorCodes.AUTH_ERROR);
      expect(error.status).toBe(401);
      expect(error.message).toBe('Bad credentials');
    });

    it('should create auth error with default message', () => {
      const error = AppError.auth();
      expect(error.message).toBe('Invalid credentials');
    });

    it('should create forbidden error', () => {
      const error = AppError.forbidden('Not allowed');
      expect(error.code).toBe(ErrorCodes.FORBIDDEN);
      expect(error.status).toBe(403);
    });

    it('should create forbidden error with default message', () => {
      const error = AppError.forbidden();
      expect(error.message).toBe('Access denied');
    });

    it('should create not found error', () => {
      const error = AppError.notFound('User');
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.status).toBe(404);
      expect(error.message).toBe('User not found');
    });

    it('should create not found error with default message', () => {
      const error = AppError.notFound();
      expect(error.message).toBe('Resource not found');
    });

    it('should create conflict error', () => {
      const error = AppError.conflict('Email already exists');
      expect(error.code).toBe(ErrorCodes.CONFLICT);
      expect(error.status).toBe(409);
    });

    it('should create conflict error with default message', () => {
      const error = AppError.conflict();
      expect(error.message).toBe('Resource already exists');
    });

    it('should create rate limited error', () => {
      const error = AppError.rateLimited('Slow down');
      expect(error.code).toBe(ErrorCodes.RATE_LIMITED);
      expect(error.status).toBe(429);
    });

    it('should create rate limited error with default message', () => {
      const error = AppError.rateLimited();
      expect(error.message).toBe('Too many requests, please try again later');
    });

    it('should create internal error', () => {
      const error = AppError.internal('Something broke');
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
      expect(error.status).toBe(500);
    });

    it('should create internal error with default message', () => {
      const error = AppError.internal();
      expect(error.message).toBe('An unexpected error occurred');
    });
  });
});

describe('Error Handler Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      id: 'test-request-id',
      path: '/test',
      method: 'GET',
      originalUrl: '/test',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    process.env.NODE_ENV = 'test';
  });

  describe('notFoundHandler', () => {
    it('should create not found error and call next', () => {
      notFoundHandler(mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      expect(error.message).toContain('GET /test');
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = AppError.notFound('User');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: ErrorCodes.NOT_FOUND,
          message: 'User not found',
          request_id: 'test-request-id',
        }),
      });
    });

    it('should include details in response', () => {
      const details = [{ field: 'email', message: 'Invalid email' }];
      const error = AppError.validation('Validation failed', details);
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          details,
        }),
      });
    });

    it('should handle JSON syntax error', () => {
      const error = new SyntaxError('Unexpected token');
      error.body = true;
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle Prisma unique constraint error', () => {
      const error = new Error('Unique constraint failed');
      error.code = 'P2002';
      error.meta = { target: ['email'] };
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: ErrorCodes.CONFLICT,
          message: 'email already exists',
        }),
      });
    });

    it('should handle Prisma not found error', () => {
      const error = new Error('Record not found');
      error.code = 'P2025';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle unknown error', () => {
      const error = new Error('Something unexpected');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    it('should not include stack in production', () => {
      process.env.NODE_ENV = 'production';
      const error = AppError.internal('Server error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      const response = mockRes.json.mock.calls[0][0];
      expect(response.error.stack).toBeUndefined();
    });
  });
});
