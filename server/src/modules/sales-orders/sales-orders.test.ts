import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

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

// Complex mock for db to handle transactions and queries
vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      salesOrders: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id', documentNumber: 'SO-2026-0001' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'so-123' }]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([]),
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
      expect(response.body).toEqual([
        {
          id: 'so-1',
          documentNumber: 'SO-001',
          lines: [],
        },
      ]);
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
    });
  });

  describe('DELETE /sales-orders/:id', () => {
    it('should delete a draft SO successfully', async () => {
      const soId = '550e8400-e29b-41d4-a716-446655440004';
      const mockSO = { id: soId, status: 'draft', documentNumber: 'SO-001' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            salesOrders: {
              findFirst: vi.fn().mockResolvedValue(mockSO),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockSO]),
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
        .delete(`/sales-orders/${soId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(204);
    });

    it('should return 400 when deleting a non-draft SO', async () => {
      const soId = '550e8400-e29b-41d4-a716-446655440004';
      const mockSO = { id: soId, status: 'shipped', documentNumber: 'SO-001' };

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

      const response = await request(app)
        .delete(`/sales-orders/${soId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Only draft sales orders can be deleted');
    });
  });

  describe('DELETE /sales-orders', () => {
    it('should bulk delete draft SOs successfully', async () => {
      const ids = ['so-1', 'so-2'];
      const mockSOs = [
        { id: 'so-1', status: 'draft', documentNumber: 'SO-001' },
        { id: 'so-2', status: 'draft', documentNumber: 'SO-002' },
      ];

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            salesOrders: {
              findMany: vi.fn().mockResolvedValue(mockSOs),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue(mockSOs),
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
        .delete('/sales-orders')
        .set('x-organization-id', mockOrgId)
        .send({ ids });

      expect(response.status).toBe(204);
    });
  });
});
