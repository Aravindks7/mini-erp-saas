import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { requireRole } from '../role.middleware.js';

describe('requireRole Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = {
      userRole: undefined,
      authSession: {
        user: { id: 'user-123' },
      } as any,
      organizationId: 'org-456',
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should return 500 if req.userRole is missing', () => {
    const middleware = requireRole(['admin']);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should return 403 if user role is not in the allowed list', () => {
    mockReq.userRole = 'employee';
    const middleware = requireRole(['admin']);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Forbidden: insufficient permissions' });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it('should call next() if user role is in the allowed list', () => {
    mockReq.userRole = 'admin';
    const middleware = requireRole(['admin', 'employee']);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should allow multiple roles and permit one that matches', () => {
    mockReq.userRole = 'employee';
    const middleware = requireRole(['admin', 'employee']);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should forbid if userRole is admin but only employee is allowed', () => {
    mockReq.userRole = 'admin';
    const middleware = requireRole(['employee']);

    middleware(mockReq as Request, mockRes as Response, nextFunction);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
