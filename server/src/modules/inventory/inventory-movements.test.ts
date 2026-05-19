import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['inventory:read', 'inventory:adjust']),
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

vi.mock('../sequences/sequences.service.js', () => ({
  sequencesService: {
    getNextSequence: vi.fn().mockResolvedValue('TRF-0001'),
  },
}));

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      inventoryTransfers: {
        findFirst: vi.fn(),
      },
      inventoryAdjustments: {
        findFirst: vi.fn(),
      },
      warehouses: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockImplementation(() => {
        const result = {
          onConflictDoUpdate: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
            then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
          })),
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
          then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
        };
        return result;
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
      }),
    })),
    transaction: vi.fn((cb) =>
      cb({
        insert: vi.fn(() => ({
          values: vi.fn().mockImplementation(() => ({
            onConflictDoUpdate: vi.fn().mockImplementation(() => ({
              returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
              then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
            })),
            returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
            then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => ({
              then: (onfulfilled: any) => Promise.resolve([{ id: 'updated-id' }]).then(onfulfilled),
            })),
          }),
        })),
        query: {
          inventoryTransfers: {
            findFirst: vi.fn(),
          },
          inventoryAdjustments: {
            findFirst: vi.fn(),
          },
          warehouses: {
            findFirst: vi.fn(),
          },
        },
        execute: vi.fn().mockResolvedValue({ rows: [] }),
      }),
    ),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('Inventory Movements (Adjustments & Transfers)', () => {
  const mockOrgId = 'org-123';
  const mockUserId = 'user-456';
  const mockSession = {
    session: { id: 'session-123' },
    user: { id: mockUserId, email: 'test@example.com' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.api.getSession as any).mockResolvedValue(mockSession);
    (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
      organizationId: mockOrgId,
      userId: mockUserId,
      organization: { id: mockOrgId },
    });
  });

  describe('POST /inventory/transfers', () => {
    it('should create a draft transfer', async () => {
      const payload = {
        fromWarehouseId: '550e8400-e29b-41d4-a716-446655440001',
        toWarehouseId: '550e8400-e29b-41d4-a716-446655440002',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440003',
            quantity: 10,
          },
        ],
      };

      const response = await request(app)
        .post('/inventory/transfers')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('POST /inventory/transfers/:id/status', () => {
    it('should ship a draft transfer', async () => {
      const mockTransfer = {
        id: 'trf-123',
        status: 'draft',
        fromWarehouseId: 'w-source',
        toWarehouseId: 'w-dest',
        lines: [{ productId: 'p1', quantity: '10' }],
      };
      const mockTransitWarehouse = { id: 'w-transit', isSystemTransit: true };

      // Setup transaction mock
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        return cb({
          query: {
            inventoryTransfers: {
              findFirst: vi.fn().mockResolvedValue(mockTransfer),
            },
            warehouses: {
              findFirst: vi.fn().mockResolvedValue(mockTransitWarehouse),
            },
          },
          execute: vi.fn().mockResolvedValue({ rows: [] }),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => ({
                then: (onfulfilled: any) =>
                  Promise.resolve([{ id: 'updated-id' }]).then(onfulfilled),
              })),
            }),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockImplementation(() => ({
              onConflictDoUpdate: vi.fn().mockImplementation(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
                then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
              })),
              returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
              then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
            })),
          })),
        });
      });

      const response = await request(app)
        .post('/inventory/transfers/trf-123/status')
        .set('x-organization-id', mockOrgId)
        .send({ status: 'shipped' });

      expect(response.status).toBe(200);
    });

    it('should receive a shipped transfer', async () => {
      const mockTransfer = {
        id: 'trf-123',
        status: 'shipped',
        fromWarehouseId: 'w-source',
        toWarehouseId: 'w-dest',
        lines: [{ productId: 'p1', quantity: '10' }],
      };
      const mockTransitWarehouse = { id: 'w-transit', isSystemTransit: true };

      // Setup transaction mock
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        return cb({
          query: {
            inventoryTransfers: {
              findFirst: vi.fn().mockResolvedValue(mockTransfer),
            },
            warehouses: {
              findFirst: vi.fn().mockResolvedValue(mockTransitWarehouse),
            },
          },
          execute: vi.fn().mockResolvedValue({ rows: [] }),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => ({
                then: (onfulfilled: any) =>
                  Promise.resolve([{ id: 'updated-id' }]).then(onfulfilled),
              })),
            }),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockImplementation(() => ({
              onConflictDoUpdate: vi.fn().mockImplementation(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
                then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
              })),
              returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
              then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
            })),
          })),
        });
      });
      const response = await request(app)
        .post('/inventory/transfers/trf-123/status')
        .set('x-organization-id', mockOrgId)
        .send({ status: 'received' });

      expect(response.status).toBe(200);
    });
  });

  describe('POST /inventory/adjustments/:id/status', () => {
    it('should approve a draft adjustment', async () => {
      const mockAdjustment = {
        id: 'adj-123',
        status: 'draft',
        lines: [{ productId: 'p1', warehouseId: 'w1', binId: 'b1', quantityChange: '5' }],
      };

      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        return cb({
          query: {
            inventoryAdjustments: {
              findFirst: vi.fn().mockResolvedValue(mockAdjustment),
            },
          },
          execute: vi.fn().mockResolvedValue({ rows: [] }),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockImplementation(() => ({
                then: (onfulfilled: any) =>
                  Promise.resolve([{ id: 'updated-id' }]).then(onfulfilled),
              })),
            }),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockImplementation(() => ({
              onConflictDoUpdate: vi.fn().mockImplementation(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
                then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
              })),
              returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
              then: (onfulfilled: any) => Promise.resolve([{ id: 'new-id' }]).then(onfulfilled),
            })),
          })),
        });
      });

      const response = await request(app)
        .post('/inventory/adjustments/adj-123/status')
        .set('x-organization-id', mockOrgId)
        .send({ status: 'approved' });

      expect(response.status).toBe(200);
    });
  });
});
