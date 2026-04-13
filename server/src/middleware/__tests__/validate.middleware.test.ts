import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validate.middleware.js';

describe('validate Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction = vi.fn();

  const testSchema = z.object({
    name: z.string().min(3),
    age: z.number().optional(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should call next() if validation succeeds', () => {
    mockReq.body = { name: 'John' };
    const middleware = validate(testSchema);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error));
    expect(mockReq.body).toEqual({ name: 'John' });
  });

  it('should call next(error) if validation fails', () => {
    mockReq.body = { name: 'Jo' }; // too short
    const middleware = validate(testSchema);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(z.ZodError));
  });

  it('should sanitize body and remove unknown fields', () => {
    mockReq.body = { name: 'John', unknownField: 'hack' };
    const middleware = validate(testSchema);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockReq.body).toEqual({ name: 'John' });
    expect(mockReq.body.unknownField).toBeUndefined();
  });
});
