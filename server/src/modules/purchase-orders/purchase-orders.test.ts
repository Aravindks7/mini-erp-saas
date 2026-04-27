import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { sequencesService } from '../sequences/sequences.service.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'purchase-orders:read',
        'purchase-orders:create',
        'purchase-orders:update',
        'purchase-orders:delete',
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

vi.mock('../sequences/sequences.service.js', () => ({
  sequencesService: {
    getNextSequence: vi.fn().mockResolvedValue('PO-2026-0001'),
  },
}));

// Complex mock for db to handle transactions and queries
vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      purchaseOrders: {
        findFirst: vi.fn(),
      },
      inventoryLevels: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'PO-2026-0001' }]),
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'po-123', status: 'received' }]),
      }),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        purchaseOrders: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'PO-2026-0001' }]),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Purchase Orders Module', () => {
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440001';
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

  describe('GET /purchase-orders', () => {
    it('should return 200 and a list of purchase orders', async () => {
      const mockPOs = [{ id: 'po-1', documentNumber: 'PO-001' }];
      (db.query.purchaseOrders.findMany as any).mockResolvedValue(mockPOs);

      const response = await request(app)
        .get('/purchase-orders')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPOs);
    });
  });

  describe('POST /purchase-orders', () => {
    it('should create a PO with valid data', async () => {
      const payload = {
        supplierId: '550e8400-e29b-41d4-a716-446655440002',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440003',
            quantity: '10',
            unitPrice: '100',
            taxRateAtOrder: '0.1',
            taxAmount: '100',
          },
        ],
      };

      const response = await request(app)
        .post('/purchase-orders')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });

    it('should return 400 for invalid data', async () => {
      const payload = {
        supplierId: 'not-a-uuid',
        lines: [],
      };

      const response = await request(app)
        .post('/purchase-orders')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /purchase-orders/:id/receive', () => {
    it('should receive a PO successfully', async () => {
      const poId = '550e8400-e29b-41d4-a716-446655440004';
      const poLineId = '550e8400-e29b-41d4-a716-446655440006';
      const mockPO = {
        id: poId,
        documentNumber: 'PO-2026-0001',
        status: 'draft',
        lines: [
          {
            id: poLineId,
            productId: '550e8400-e29b-41d4-a716-446655440007',
          },
        ],
      };

      // Ensure mockTx in db.transaction returns our mock PO
      // We'll use mocked implementation once to handle the sequential nature
      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findFirst: vi.fn().mockResolvedValue(mockPO),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'adj-1' }]),
              onConflictDoUpdate: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
              }),
            }),
          })),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ id: poId, status: 'received' }]),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const payload = {
        lines: [
          {
            purchaseOrderLineId: poLineId,
            warehouseId: '550e8400-e29b-41d4-a716-446655440005',
            quantityReceived: '10',
          },
        ],
      };

      const response = await request(app)
        .post(`/purchase-orders/${poId}/receive`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('received');
    });

    it('should return 400 if PO is already received', async () => {
      const poId = '550e8400-e29b-41d4-a716-446655440004';
      const poLineId = '550e8400-e29b-41d4-a716-446655440006';
      const mockPO = {
        id: poId,
        status: 'received',
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findFirst: vi.fn().mockResolvedValue(mockPO),
            },
          },
        } as any;
        return cb(tx);
      });

      const payload = {
        lines: [
          {
            purchaseOrderLineId: poLineId,
            warehouseId: '550e8400-e29b-41d4-a716-446655440005',
            quantityReceived: '10',
          },
        ],
      };

      const response = await request(app)
        .post(`/purchase-orders/${poId}/receive`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already received');
    });
  });
});
