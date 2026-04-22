import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorMiddleware } from '../error.middleware.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';

vi.mock('../../utils/logger.js', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('errorMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      method: 'GET',
      originalUrl: '/test',
      body: {},
    };
    mockRes = {
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should delegate to next if headers are already sent', () => {
    mockRes.headersSent = true;
    const err = new Error('Already sent');

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(err);
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should handle AppError correctly', () => {
    const err = new AppError('App specific error', 418);

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(418);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'fail',
      error: 'App specific error',
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle ZodError correctly', () => {
    const err = new ZodError([{ code: 'custom', path: ['name'], message: 'Zod fail' }]);

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'fail',
      error: 'Validation failed',
      issues: err.issues,
    });
    expect(logger.warn).toHaveBeenCalled();
  });

  it('should handle Database Unique Constraint Violation (23505)', () => {
    const err = {
      code: '23505',
      message: 'duplicate key',
      detail: 'Key (email)=(test@test.com) already exists.',
    };

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'fail',
      error: 'Conflict: Record already exists.',
    });
  });

  it('should handle generic Error and hide stack in production', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('Generic failure');

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 'error',
      error: 'Internal Server Error',
    });
    expect(mockRes.json).not.toHaveProperty('stack');

    process.env.NODE_ENV = 'test'; // restore
  });

  it('should handle generic Error and show stack in non-production', () => {
    process.env.NODE_ENV = 'development';
    const err = new Error('Dev failure');

    errorMiddleware(err, mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    const jsonResult = vi.mocked(mockRes.json!).mock.calls[0]?.[0];
    expect(jsonResult.error).toBe('Dev failure');
    expect(jsonResult).toHaveProperty('stack');

    process.env.NODE_ENV = 'test'; // restore
  });
});
