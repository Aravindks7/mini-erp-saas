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
      .mockResolvedValue(['taxes:read', 'taxes:create', 'taxes:update', 'taxes:delete']),
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

const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-id', name: 'VAT', rate: '15.00' }]);
const mockValues = mockChained([{ id: 'new-id' }]);
const mockWhere = mockChained([{ id: 'updated-id' }]);
const mockSet = vi.fn().mockImplementation(() => {
  const s = { where: mockWhere, returning: mockReturning };
  return s;
});

const mockTx = {
  query: {
    taxes: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
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
      taxes: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'tax-id', name: 'Updated' }]),
        }),
      }),
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../db/setTenant.js', () => ({
  setTenant: vi.fn().mockResolvedValue(undefined),
}));

// --- TESTS ---

describe('Taxes Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mockTx implementations to default to avoid leak between tests
    vi.mocked(mockTx.update).mockReturnValue({ set: mockSet });
    vi.mocked(mockTx.delete).mockReturnValue({ where: mockWhere });
    vi.mocked(mockTx.query.taxes.findFirst).mockResolvedValue(null);
  });

  describe('Authentication & Multi-Tenancy', () => {
    it('should return 401 if unauthorized (no session)', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

      const response = await request(app).get('/taxes').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 if x-organization-id header is missing', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);

      const response = await request(app).get('/taxes');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('x-organization-id');
    });

    it('should return 403 if user is not a member of the organization', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);

      const response = await request(app).get('/taxes').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('RBAC Enforcement', () => {
    it('should allow employees to list Taxes if they have read permission', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      } as any);
      vi.mocked(db.query.taxes.findMany).mockResolvedValue([]);

      const response = await request(app).get('/taxes').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
    });

    it('should forbid employees from deleting Taxes if missing permission', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'employee',
        organization: { id: mockOrgId },
      } as any);
      vi.mocked(rbacService.getPermissions).mockResolvedValueOnce(['taxes:read']);

      const response = await request(app)
        .delete('/taxes/tax-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Forbidden: missing required permission');
    });
  });

  describe('CRUD Lifecycle', () => {
    beforeEach(() => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        role: 'admin',
        organization: { id: mockOrgId },
      } as any);
    });

    it('should create a Tax', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-tax-id', name: 'VAT', rate: '15.00' }]),
        }),
      } as any);

      const response = await request(app)
        .post('/taxes')
        .send({ name: 'VAT', rate: '15.00' })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('VAT');
      expect(response.body.rate).toBe('15.00');
    });

    it('should fail to create a Tax with duplicate name', async () => {
      vi.mocked(db.query.taxes.findFirst).mockResolvedValue({
        id: 'existing-id',
        name: 'VAT',
      } as any);

      const response = await request(app)
        .post('/taxes')
        .send({ name: 'VAT', rate: '15.00' })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
    });

    it('should list Taxes', async () => {
      vi.mocked(db.query.taxes.findMany).mockResolvedValue([
        { id: 'tax-1', name: 'VAT', rate: '15.00' },
        { id: 'tax-2', name: 'GST', rate: '5.00' },
      ] as any);

      const response = await request(app).get('/taxes').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should get a Tax by ID', async () => {
      vi.mocked(db.query.taxes.findFirst).mockResolvedValue({
        id: 'tax-123',
        name: 'VAT',
        rate: '15.00',
      } as any);

      const response = await request(app).get('/taxes/tax-123').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('tax-123');
    });

    it('should return 404 for non-existent Tax', async () => {
      vi.mocked(db.query.taxes.findFirst).mockResolvedValue(undefined);

      const response = await request(app)
        .get('/taxes/non-existent')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(404);
    });

    it('should update a Tax', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'tax-123', name: 'Updated Name' }]),
          }),
        }),
      } as any);

      const response = await request(app)
        .patch('/taxes/tax-123')
        .send({ name: 'Updated Name' })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
    });

    it('should delete a Tax', async () => {
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'tax-123' }]),
          }),
        }),
      } as any);

      const response = await request(app)
        .delete('/taxes/tax-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully');
    });

    it('should bulk delete Taxes', async () => {
      const id1 = '123e4567-e89b-12d3-a456-426614174001';
      const id2 = '123e4567-e89b-12d3-a456-426614174002';
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: id1 }, { id: id2 }]),
          }),
        }),
      } as any);

      const response = await request(app)
        .delete('/taxes')
        .send({ ids: [id1, id2] })
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.deletedCount).toBe(2);
    });
  });
});
