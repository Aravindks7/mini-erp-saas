import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

// --- MOCKS ---

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'customers:read',
        'customers:create',
        'customers:update',
        'customers:delete',
      ]),
  },
}));

const mockTx = {
  query: {
    customers: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
  })),
};

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      customers: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi
              .fn()
              .mockResolvedValue([
                { id: 'customers:read' },
                { id: 'customers:create' },
                { id: 'customers:update' },
                { id: 'customers:delete' },
              ]),
          })),
        })),
      })),
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn(),
  },
}));

describe('Customers Export/Import Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
      id: 'mem-123',
      userId: mockUserId,
      organizationId: mockOrgId,
      roleId: 'role-admin',
      role: 'admin',
      organization: { id: mockOrgId },
    } as any);
  });

  describe('GET /customers/export', () => {
    it('should return a CSV file', async () => {
      vi.mocked(db.query.customers.findMany).mockResolvedValue([
        {
          companyName: 'Test Corp',
          taxNumber: '123',
          status: 'active',
          addresses: [],
          contacts: [],
          createdAt: new Date(),
        },
      ] as any);

      const response = await request(app)
        .get('/customers/export')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/csv');
      expect(response.text).toContain('companyName,taxNumber,status');
      expect(response.text).toContain('Test Corp,123,active');
    });

    it('should sanitize CSV values', async () => {
      vi.mocked(db.query.customers.findMany).mockResolvedValue([
        {
          companyName: '=1+2',
          taxNumber: '123',
          status: 'active',
          addresses: [],
          contacts: [],
          createdAt: new Date(),
        },
      ] as any);

      const response = await request(app)
        .get('/customers/export')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.text).toContain("'=1+2");
    });
  });

  describe('GET /customers/import/template', () => {
    it('should return the import template CSV', async () => {
      const response = await request(app)
        .get('/customers/import/template')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('text/csv');
      expect(response.text).toContain('companyName,taxNumber,status,contactFirstName');
    });
  });

  describe('POST /customers/import', () => {
    it('should import valid customers and return summary', async () => {
      const csvContent = 'companyName,taxNumber,status\nNew Corp,999,active';
      const buffer = Buffer.from(csvContent);

      const response = await request(app)
        .post('/customers/import')
        .attach('file', buffer, 'customers.csv')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.totalProcessed).toBe(1);
      expect(response.body.successCount).toBe(1);
      expect(response.body.failedCount).toBe(0);
    });

    it('should handle duplicates by skipping and reporting', async () => {
      vi.mocked(db.query.customers.findFirst).mockResolvedValue({ id: 'existing' } as any);

      const csvContent = 'companyName,taxNumber,status\nExisting Corp,999,active';
      const buffer = Buffer.from(csvContent);

      const response = await request(app)
        .post('/customers/import')
        .attach('file', buffer, 'customers.csv')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.successCount).toBe(0);
      expect(response.body.failedCount).toBe(1);
      expect(response.body.errors[0].message).toContain('already exists');
    });

    it('should handle validation errors', async () => {
      const csvContent = 'companyName,taxNumber,status\n,999,active'; // Missing companyName
      const buffer = Buffer.from(csvContent);

      const response = await request(app)
        .post('/customers/import')
        .attach('file', buffer, 'customers.csv')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.totalProcessed).toBe(1);
      expect(response.body.successCount).toBe(0);
      expect(response.body.failedCount).toBe(1);
      expect(response.body.errors[0].message).toContain('companyName');
    });
  });
});
