import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { rbacService } from '../rbac/rbac.service.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'suppliers:read',
        'suppliers:create',
        'suppliers:update',
        'suppliers:delete',
      ]),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-id', name: 'Mock Supplier' }]);

// Helper to create a mock that supports .returning() and is awaitable
const mockChained = <T>(val: T) => {
  const m = vi.fn().mockImplementation(() => {
    const p = Promise.resolve(val);
    return Object.assign(p, {
      returning: vi.fn().mockResolvedValue(val),
      onConflictDoNothing: vi.fn().mockReturnValue(p),
    });
  });
  return m;
};

const mockValues = mockChained([{ id: 'new-id' }]);
const mockWhere = mockChained([{ id: 'updated-id' }]);
const mockSet = vi.fn().mockImplementation(() => {
  const s = { where: mockWhere, returning: mockReturning };
  return s;
});

const mockTx = {
  query: {
    suppliers: {
      findFirst: vi.fn().mockResolvedValue({ id: 'supp-123', name: 'Mock Supplier' }),
    },
    supplierAddresses: { findMany: vi.fn().mockResolvedValue([]) },
    supplierContacts: { findMany: vi.fn().mockResolvedValue([]) },
  },
  insert: vi.fn(() => ({ values: mockValues })),
  update: vi.fn(() => ({ set: mockSet })),
  delete: vi.fn(() => ({ where: mockWhere })),
};

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      suppliers: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      supplierAddresses: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      supplierContacts: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ id: 'perm:1' }]),
          })),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'supplier-id', name: 'Updated' }]),
        }),
      }),
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn(),
  },
}));

export { mockValues, mockReturning };

// --- TESTS ---

describe('Suppliers Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockTx.update).mockReturnValue({ set: mockSet });
    vi.mocked(mockTx.delete).mockReturnValue({ where: mockWhere });
  });

  describe('Authentication & Multi-Tenancy', () => {
    it('should return 401 if unauthorized (no session)', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

      const response = await request(app).get('/suppliers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if x-organization-id header is missing', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);

      const response = await request(app).get('/suppliers');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('x-organization-id');
    });

    it('should return 403 if user is not a member of the organization', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);

      const response = await request(app).get('/suppliers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('RBAC Enforcement', () => {
    it('should allow employees to list suppliers', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      } as any);
      vi.mocked(db.query.suppliers.findMany).mockResolvedValue([]);

      const response = await request(app).get('/suppliers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
    });

    it('should forbid employees from deleting suppliers', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      } as any);
      vi.mocked(rbacService.getPermissions).mockResolvedValueOnce(['suppliers:read']);

      const response = await request(app)
        .delete('/suppliers/supp-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden: missing required permission');
    });

    it('should allow admins to delete suppliers', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);

      vi.mocked(mockTx.delete).mockReturnValue({
        where: mockWhere.mockReturnValue({
          returning: mockReturning.mockResolvedValue([{ id: 'supp-123' }]),
        }),
      } as any);

      const response = await request(app)
        .delete('/suppliers/supp-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });
  });

  describe('CRUD Lifecycle', () => {
    it('should successfully update a supplier via PATCH', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);

      const response = await request(app)
        .patch('/suppliers/supp-123')
        .send({ name: 'New Acme' })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('supp-123');
    });

    it('should successfully bulk delete suppliers via DELETE', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([
                { id: '123e4567-e89b-12d3-a456-426614174001' },
                { id: '123e4567-e89b-12d3-a456-426614174002' },
              ]),
          }),
        }),
      } as any);

      const response = await request(app)
        .delete('/suppliers')
        .send({
          ids: ['123e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174002'],
        })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);
      expect(response.body.deletedIds).toEqual([
        '123e4567-e89b-12d3-a456-426614174001',
        '123e4567-e89b-12d3-a456-426614174002',
      ]);
    });

    it('should return 400 if ids array is missing or empty in bulk delete', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);

      const response = await request(app)
        .delete('/suppliers')
        .send({ ids: [] })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
    });
  });

  describe('Aggregate Root Mutation & Nested Retrieval', () => {
    beforeEach(() => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);
    });

    it('should create a supplier with nested contacts and addresses', async () => {
      vi.mocked(db.query.suppliers.findFirst).mockResolvedValueOnce(undefined);
      const complexPayload = {
        name: 'Acme Supplier',
        taxNumber: 'TAX-123',
        contacts: [{ firstName: 'John', lastName: 'Doe', isPrimary: true }],
        addresses: [
          { addressLine1: '123 Main St', city: 'Springfield', country: 'USA', isPrimary: true },
        ],
      };

      const response = await request(app)
        .post('/suppliers')
        .send(complexPayload)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(201);
    });

    it('should retrieve a supplier with nested data (GET /:id)', async () => {
      vi.mocked(db.query.suppliers.findFirst).mockResolvedValue({
        id: 'supp-123',
        name: 'Mock Supplier',
        addresses: [{ address: { city: 'Springfield' } }],
        contacts: [{ contact: { firstName: 'John' } }],
      } as any);

      const response = await request(app)
        .get('/suppliers/supp-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.addresses).toBeDefined();
      expect(response.body.contacts).toBeDefined();
    });

    it('should list suppliers with nested data (GET /)', async () => {
      vi.mocked(db.query.suppliers.findMany).mockResolvedValue([
        {
          id: 'supp-1',
          name: 'Supplier 1',
          addresses: [],
          contacts: [],
        },
      ] as any);

      const response = await request(app).get('/suppliers').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0].addresses).toBeDefined();
    });

    describe('Cross-Tenant Security Boundaries', () => {
      it('should return 404 when attempting to access a supplier belonging to another organization', async () => {
        vi.mocked(db.query.suppliers.findFirst).mockResolvedValue(null as any);

        const otherOrgSupplierId = 'other-org-supp-uuid';
        const response = await request(app)
          .get(`/suppliers/${otherOrgSupplierId}`)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(404);
      });

      it('should return 404 when attempting to update a supplier belonging to another organization', async () => {
        vi.mocked(mockTx.update).mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),
            }),
          }),
        } as any);

        const otherOrgSupplierId = 'other-org-supp-uuid';
        const response = await request(app)
          .patch(`/suppliers/${otherOrgSupplierId}`)
          .send({ name: 'Hack Attempt' })
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(404);
      });
    });

    it('should fail if name is missing', async () => {
      const response = await request(app)
        .post('/suppliers')
        .send({ taxNumber: '123' })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
    });

    describe('Transactional Atomicity', () => {
      it('should rollback supplier creation if address insertion fails', async () => {
        vi.mocked(mockTx.insert)
          .mockImplementationOnce(
            () =>
              ({
                values: vi.fn().mockReturnValue({
                  returning: vi.fn().mockResolvedValue([{ id: 'supp-123' }]),
                }),
              }) as unknown as ReturnType<typeof mockTx.insert>,
          )
          .mockImplementationOnce(() => {
            throw new Error('DATABASE_CRASH_ON_ADDRESS');
          });

        const payload = {
          name: 'Atomic Supplier',
          addresses: [{ addressLine1: 'Fail St', city: 'Fail', country: 'USA' }],
        };

        const response = await request(app)
          .post('/suppliers')
          .send(payload)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(500);
        expect(db.transaction).toHaveBeenCalled();
      });
    });

    describe('Primary Record Normalization', () => {
      it('should normalize multiple primary addresses to a single primary in createSupplier', async () => {
        vi.mocked(db.query.suppliers.findFirst).mockResolvedValueOnce(undefined);
        const payload = {
          name: 'Acme Supplier',
          addresses: [
            { addressLine1: 'Addr 1', city: 'City', country: 'USA', isPrimary: true },
            { addressLine1: 'Addr 2', city: 'City', country: 'USA', isPrimary: true },
          ],
        };

        const response = await request(app)
          .post('/suppliers')
          .send(payload)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(201);
      });

      it('should reset existing primaries when a new primary is designated in updateSupplier', async () => {
        const payload = {
          addresses: [
            { addressLine1: 'New Primary', city: 'City', country: 'USA', isPrimary: true },
          ],
        };

        const response = await request(app)
          .patch('/suppliers/supp-123')
          .send(payload)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(200);
      });
    });
  });
});
