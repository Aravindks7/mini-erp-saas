import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'warehouses:read',
        'warehouses:create',
        'warehouses:update',
        'warehouses:delete',
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

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      warehouses: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      warehouseAddresses: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      bins: {
        findMany: vi.fn().mockResolvedValue([]),
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
          returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([{ id: 'deleted-id' }]),
    })),
    transaction: vi.fn((cb) =>
      cb({
        query: {
          warehouses: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'wh-123',
              code: 'WH1',
              name: 'Warehouse 1',
              addresses: [],
            }),
          },
          warehouseAddresses: { findMany: vi.fn().mockResolvedValue([]) },
          bins: { findMany: vi.fn().mockResolvedValue([]) },
        },
        insert: vi.fn(() => ({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
          }),
        })),
        update: vi.fn(() => ({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
            }),
          }),
        })),
        delete: vi.fn(() => ({
          where: vi.fn().mockResolvedValue([{ id: 'deleted-id' }]),
        })),
      }),
    ),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('Warehousing Module', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockSession = {
    session: { id: 'session-123' },
    user: { id: mockUserId, email: 'test@example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default successful auth/org
    (auth.api.getSession as any).mockResolvedValue(mockSession);
    (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
      organizationId: mockOrgId,
      userId: mockUserId,
      organization: { id: mockOrgId },
    });
  });

  describe('GET /warehouses', () => {
    it('should return 200 and a list of warehouses', async () => {
      const mockWarehouses = [
        { id: '1', code: 'WH1', name: 'Warehouse 1', addresses: [] },
        { id: '2', code: 'WH2', name: 'Warehouse 2', addresses: [] },
      ];
      (db.query.warehouses.findMany as any).mockResolvedValue(mockWarehouses);

      const response = await request(app).get('/warehouses').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockWarehouses);
    });

    it('should return 401 if not authenticated', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);
      const response = await request(app).get('/warehouses');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /warehouses', () => {
    it('should create a new warehouse with valid data', async () => {
      const newWarehouse = {
        code: 'WH-001',
        name: 'Main Distribution Center',
        addresses: [
          {
            addressLine1: '123 Logistics Way',
            city: 'Distribution City',
            country: 'USA',
            isPrimary: true,
          },
        ],
        bins: [{ code: 'A1-01', name: 'Aisle 1, Bin 01' }],
      };

      const response = await request(app)
        .post('/warehouses')
        .set('x-organization-id', mockOrgId)
        .send(newWarehouse);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/warehouses')
        .set('x-organization-id', mockOrgId)
        .send({ name: 'Only Name' }); // missing code

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('PATCH /warehouses/:id', () => {
    it('should update an existing warehouse', async () => {
      const updateData = { name: 'Updated Warehouse Name' };
      const response = await request(app)
        .patch('/warehouses/wh-123')
        .set('x-organization-id', mockOrgId)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /warehouses/:id', () => {
    it('should soft-delete a warehouse', async () => {
      const response = await request(app)
        .delete('/warehouses/wh-123')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
