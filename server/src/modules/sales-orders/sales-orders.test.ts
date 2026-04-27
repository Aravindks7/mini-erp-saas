import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { sequencesService } from '../sequences/sequences.service.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'sales-orders:read',
        'sales-orders:create',
        'sales-orders:update',
        'sales-orders:delete',
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
    getNextSequence: vi.fn().mockResolvedValue('SO-2026-0001'),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      salesOrders: {
        findFirst: vi.fn(),
      },
      inventoryLevels: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'SO-2026-0001' }]),
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'so-123', status: 'shipped' }]),
      }),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        salesOrders: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'SO-2026-0001' }]),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Sales Orders Module', () => {
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

  describe('GET /sales-orders', () => {
    it('should return 200 and a list of sales orders', async () => {
      const mockSOs = [{ id: 'so-1', documentNumber: 'SO-001' }];
      (db.query.salesOrders.findMany as any).mockResolvedValue(mockSOs);

      const response = await request(app).get('/sales-orders').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockSOs);
    });
  });

  describe('POST /sales-orders', () => {
    it('should create a SO with valid data', async () => {
      const payload = {
        customerId: '550e8400-e29b-41d4-a716-446655440002',
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
        .post('/sales-orders')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });

    it('should return 400 for invalid data', async () => {
      const payload = {
        customerId: 'not-a-uuid',
        lines: [],
      };

      const response = await request(app)
        .post('/sales-orders')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });

  describe('POST /sales-orders/:id/fulfill', () => {
    it('should fulfill a SO successfully', async () => {
      const soId = '550e8400-e29b-41d4-a716-446655440004';
      const soLineId = '550e8400-e29b-41d4-a716-446655440006';
      const mockSO = {
        id: soId,
        documentNumber: 'SO-2026-0001',
        status: 'draft',
        lines: [
          {
            id: soLineId,
            productId: '550e8400-e29b-41d4-a716-446655440007',
          },
        ],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            salesOrders: {
              findFirst: vi.fn().mockResolvedValue(mockSO),
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
              where: vi.fn().mockResolvedValue([{ id: soId, status: 'shipped' }]),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const payload = {
        lines: [
          {
            salesOrderLineId: soLineId,
            warehouseId: '550e8400-e29b-41d4-a716-446655440005',
            quantityShipped: '10',
          },
        ],
      };

      const response = await request(app)
        .post(`/sales-orders/${soId}/fulfill`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('shipped');
    });

    it('should return 400 if SO is already shipped', async () => {
      const soId = '550e8400-e29b-41d4-a716-446655440004';
      const soLineId = '550e8400-e29b-41d4-a716-446655440006';
      const mockSO = {
        id: soId,
        status: 'shipped',
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            salesOrders: {
              findFirst: vi.fn().mockResolvedValue(mockSO),
            },
          },
        } as any;
        return cb(tx);
      });

      const payload = {
        lines: [
          {
            salesOrderLineId: soLineId,
            warehouseId: '550e8400-e29b-41d4-a716-446655440005',
            quantityShipped: '10',
          },
        ],
      };

      const response = await request(app)
        .post(`/sales-orders/${soId}/fulfill`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already shipped');
    });
  });
});
