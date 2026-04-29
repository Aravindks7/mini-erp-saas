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
      .mockResolvedValue(['bills:read', 'bills:create', 'bills:update', 'bills:delete']),
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
    getNextSequence: vi.fn().mockResolvedValue('BIL-2026-0001'),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      bills: {
        findFirst: vi.fn(),
      },
      receipts: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 'new-bill-id', documentNumber: 'BIL-2026-0001' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'bill-123', status: 'open' }]),
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
        bills: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ id: 'new-bill-id', documentNumber: 'BIL-2026-0001' }]),
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'bill-123', status: 'open' }]),
          }),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Bills Module', () => {
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

  describe('GET /bills', () => {
    it('should return 200 and a list of bills', async () => {
      const mockBills = [{ id: 'bill-1', documentNumber: 'BIL-001' }];
      (db.query.bills.findMany as any).mockResolvedValue(mockBills);

      const response = await request(app).get('/bills').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBills);
    });
  });

  describe('POST /bills', () => {
    it('should create a bill with valid data', async () => {
      const payload = {
        supplierId: '550e8400-e29b-41d4-a716-446655440002',
        referenceNumber: 'VEND-INV-100',
        issueDate: '2026-04-29',
        dueDate: '2026-05-29',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440003',
            quantity: '1',
            unitPrice: '1000',
            taxRateAtOrder: '0.1',
            taxAmount: '100',
            lineTotal: '1100',
          },
        ],
      };

      const response = await request(app)
        .post('/bills')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });
  });

  describe('POST /bills/from-receipt/:receiptId', () => {
    it('should create a bill from a Receipt', async () => {
      const receiptId = '550e8400-e29b-41d4-a716-446655440010';
      const mockReceipt = {
        id: receiptId,
        purchaseOrderId: 'po-123',
        purchaseOrder: {
          id: 'po-123',
          supplierId: 'supp-123',
          documentNumber: 'PO-001',
        },
        lines: [
          {
            productId: 'prod-1',
            quantityReceived: '10',
            purchaseOrderLine: {
              unitPrice: '100',
              taxRateAtOrder: '5',
            },
          },
        ],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            receipts: {
              findFirst: vi.fn().mockResolvedValue(mockReceipt),
            },
            bills: {
              findFirst: vi
                .fn()
                .mockResolvedValue({ id: 'new-bill-id', documentNumber: 'BIL-2026-0001' }),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              returning: vi
                .fn()
                .mockResolvedValue([{ id: 'new-bill-id', documentNumber: 'BIL-2026-0001' }]),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .post(`/bills/from-receipt/${receiptId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(201);
      expect(response.body.documentNumber).toBe('BIL-2026-0001');
    });
  });

  describe('PATCH /bills/:id/status', () => {
    it('should update bill status', async () => {
      const billId = 'bill-123';
      const response = await request(app)
        .patch(`/bills/${billId}/status`)
        .set('x-organization-id', mockOrgId)
        .send({ status: 'open' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('open');
    });
  });
});
