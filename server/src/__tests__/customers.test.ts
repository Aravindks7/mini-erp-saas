import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { auth } from '../lib/auth.js';
import { db } from '../db/index.js';
import { organizationMemberships } from '../db/schema/index.js';

// Mock auth and db
vi.mock('../lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

const mockValues = vi.fn().mockReturnThis();
const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-customer-id', firstName: 'Test' }]);
const mockSet = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();

vi.mock('../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      customers: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: mockValues.mockReturnValue({
        returning: mockReturning,
      }),
    })),
    update: vi.fn(() => ({
      set: mockSet.mockReturnValue({
        where: mockWhere.mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'customer-id', firstName: 'Updated' }]),
        }),
      }),
    })),
    execute: vi.fn(),
  },
}));

export { mockValues, mockReturning };

describe('Customers Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication & Multi-Tenancy', () => {
    it('should return 401 if unauthorized (no session)', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      const response = await request(app).get('/customers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if x-organization-id header is missing', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });

      const response = await request(app).get('/customers');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('x-organization-id');
    });

    it('should return 403 if user is not a member of the organization', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue(null);

      const response = await request(app).get('/customers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('RBAC Enforcement', () => {
    it('should allow employees to list customers', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      });
      (db.query.customers.findMany as any).mockResolvedValue([]);

      const response = await request(app).get('/customers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
    });

    it('should forbid employees from deleting customers', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      });

      const response = await request(app)
        .delete('/customers/cust-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('insufficient permissions');
    });

    it('should allow admins to delete customers', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      });
      // Mock the update (soft delete) returning a result
      (db.update as any)()
        .set()
        .where()
        .returning.mockResolvedValue([{ id: 'cust-123' }]);

      const response = await request(app)
        .delete('/customers/cust-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });
  });

  describe('Audit Logging', () => {
    it('should inject createdBy when creating a customer', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      });

      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await request(app).post('/customers').send(customerData).set('x-organization-id', mockOrgId);

      // Verify createdBy was injected
      const firstCall = mockValues.mock.calls[0];
      expect(firstCall).toBeDefined();
      const valuesCall = firstCall![0];

      expect(valuesCall.createdBy).toBe(mockUserId);
      expect(valuesCall.organizationId).toBe(mockOrgId);
    });
  });
});
