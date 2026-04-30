import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['payments:read', 'payments:create']),
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

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      payments: {
        findFirst: vi.fn(),
      },
      invoices: {
        findFirst: vi.fn(),
      },
      bills: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-payment-id' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'inv-123', status: 'paid' }]),
        }),
      }),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ total: '1000' }]),
      })),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        payments: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-payment-id' }]),
        }),
      })),
      transaction: vi.fn((cb) => cb(mockTx)),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

describe('Payments Module', () => {
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

  describe('GET /payments', () => {
    it('should return 200 and a list of payments', async () => {
      const mockPayments = [{ id: 'pay-1', amount: '1000' }];
      (db.query.payments.findMany as any).mockResolvedValue(mockPayments);

      const response = await request(app).get('/payments').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPayments);
    });
  });

  describe('POST /payments', () => {
    it('should create an inbound payment for an invoice and update its status', async () => {
      const invoiceId = '550e8400-e29b-41d4-a716-446655440002';
      const payload = {
        paymentType: 'inbound',
        paymentMethod: 'bank_transfer',
        amount: '1000',
        invoiceId,
      };

      const mockInvoice = {
        id: invoiceId,
        totalAmount: '1000',
        status: 'open',
      };

      // Set up the transaction mock for this specific test
      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            invoices: {
              findFirst: vi.fn().mockResolvedValue(mockInvoice),
            },
            payments: {
              findFirst: vi.fn().mockResolvedValue({ id: 'new-payment-id', ...payload }),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'new-payment-id' }]),
            }),
          })),
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([{ id: invoiceId, status: 'paid' }]),
            }),
          })),
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([{ total: '1000' }]),
            })),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .post('/payments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('new-payment-id');
      expect(db.transaction).toHaveBeenCalled();
    });

    it('should fail if amount is negative', async () => {
      const payload = {
        paymentType: 'inbound',
        paymentMethod: 'cash',
        amount: '-100',
        customerId: '550e8400-e29b-41d4-a716-446655440005',
      };

      const response = await request(app)
        .post('/payments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });
});
