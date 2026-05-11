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

vi.mock('../../lib/activity-logger.js', () => ({
  ActivityLogger: {
    record: vi.fn().mockResolvedValue(undefined),
    recordUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

// Complex mock for db to handle transactions and queries
vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      purchaseOrders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'PO-2026-0001' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'po-123' }]),
        }),
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
      update: vi.fn(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'po-123' }]),
          }),
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

      const { ActivityLogger } = await import('../../lib/activity-logger.js');
      expect(ActivityLogger.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'PO_CREATED',
          entityType: 'purchase_order',
        }),
      );
    });
  });

  describe('PATCH /purchase-orders/:id', () => {
    it('should update a draft PO and record diff', async () => {
      const poId = '550e8400-e29b-41d4-a716-446655440004';
      const supplierId1 = '550e8400-e29b-41d4-a716-446655440005';
      const supplierId2 = '550e8400-e29b-41d4-a716-446655440006';
      const productId = '550e8400-e29b-41d4-a716-446655440007';

      const mockPO = {
        id: poId,
        status: 'draft',
        documentNumber: 'PO-001',
        supplierId: supplierId1,
        totalAmount: '100',
      };
      const payload = {
        supplierId: supplierId2,
        lines: [
          {
            productId: productId,
            quantity: '10',
            unitPrice: '20',
            taxRateAtOrder: '0',
            taxAmount: '0',
          },
        ],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findFirst: vi.fn().mockResolvedValue(mockPO),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPO]),
              }),
            }),
          })),
          delete: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .patch(`/purchase-orders/${poId}`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(200);
      const { ActivityLogger } = await import('../../lib/activity-logger.js');
      expect(ActivityLogger.recordUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ action: 'UPDATED' }),
        expect.objectContaining({ id: poId }),
        expect.objectContaining({ supplierId: supplierId2 }),
      );
    });
  });

  describe('DELETE /purchase-orders/:id', () => {
    it('should delete a draft PO successfully', async () => {
      const poId = '550e8400-e29b-41d4-a716-446655440008';
      const mockPO = { id: poId, status: 'draft', documentNumber: 'PO-001' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findFirst: vi.fn().mockResolvedValue(mockPO),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockPO]),
              }),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/purchase-orders/${poId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(204);
      const { ActivityLogger } = await import('../../lib/activity-logger.js');
      expect(ActivityLogger.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: 'DELETED',
          entityId: poId,
        }),
      );
    });

    it('should return 400 when deleting a non-draft PO', async () => {
      const poId = '550e8400-e29b-41d4-a716-446655440009';
      const mockPO = { id: poId, status: 'received', documentNumber: 'PO-001' };

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

      const response = await request(app)
        .delete(`/purchase-orders/${poId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Only draft purchase orders can be deleted');
    });
  });

  describe('DELETE /purchase-orders', () => {
    it('should bulk delete draft POs successfully', async () => {
      const ids = ['550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440011'];
      const mockPOs = [
        { id: ids[0], status: 'draft', documentNumber: 'PO-001' },
        { id: ids[1], status: 'draft', documentNumber: 'PO-002' },
      ];

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findMany: vi.fn().mockResolvedValue(mockPOs),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue(mockPOs),
              }),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete('/purchase-orders')
        .set('x-organization-id', mockOrgId)
        .send({ ids });

      expect(response.status).toBe(204);
      const { ActivityLogger } = await import('../../lib/activity-logger.js');
      expect(ActivityLogger.record).toHaveBeenCalledTimes(2);
    });
  });

  describe('PATCH /purchase-orders/:id/status', () => {
    it('should update status and return the full purchase order object', async () => {
      const poId = 'po-123';
      const mockPO = {
        id: poId,
        status: 'sent',
        documentNumber: 'PO-001',
        supplier: { name: 'Test Supplier' },
        lines: [],
      };

      // Mock the transaction to return our mockPO after the update
      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            purchaseOrders: {
              findFirst: vi.fn().mockResolvedValue(mockPO),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ status: 'sent' }]),
              }),
            }),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .patch(`/purchase-orders/${poId}/status`)
        .set('x-organization-id', mockOrgId)
        .send({
          status: 'sent',
          action: 'STATUS_CHANGED',
          reason: 'PO sent to supplier',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', poId);
      expect(response.body).toHaveProperty('status', 'sent');
      expect(response.body).toHaveProperty('documentNumber', 'PO-001');
      expect(response.body).toHaveProperty('supplier');
    });

    it('should return 400 when action or reason is missing', async () => {
      const response = await request(app)
        .patch('/purchase-orders/po-123/status')
        .set('x-organization-id', mockOrgId)
        .send({ status: 'sent' });

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('fieldErrors');
      expect(response.body.error.fieldErrors).toHaveProperty('action');
      expect(response.body.error.fieldErrors).toHaveProperty('reason');
    });
  });
});
