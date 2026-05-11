import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'invoices:read',
        'invoices:create',
        'invoices:update',
        'invoices:delete',
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

vi.mock('../../lib/activity-logger.js', () => ({
  ActivityLogger: {
    record: vi.fn().mockResolvedValue(undefined),
    recordUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      invoices: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'inv-123' }]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockReturnValue({}),
    })),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({}),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        invoices: {
          findFirst: vi.fn(),
        },
      },
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Invoices Update API', () => {
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

  describe('PATCH /invoices/:id', () => {
    it('should update a draft invoice and return hydrated object', async () => {
      const invId = 'inv-123';
      const mockInvoice = {
        id: invId,
        status: 'draft',
        documentNumber: 'INV-001',
        totalAmount: '1000',
        taxAmount: '100',
        lines: [],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            invoices: {
              findFirst: vi.fn().mockResolvedValue(mockInvoice),
            },
          },
          update: vi.fn(() => ({
            set: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([mockInvoice]),
              }),
            }),
          })),
          delete: vi.fn(() => ({
            where: vi.fn().mockReturnValue({}),
          })),
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({}),
          })),
        } as any;
        return cb(tx);
      });

      const payload = {
        notes: 'Updated notes',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440003',
            quantity: '1',
            unitPrice: '2000',
            taxRateAtOrder: '0.1',
            taxAmount: '200',
            lineTotal: '2200',
          },
        ],
      };

      const response = await request(app)
        .patch(`/invoices/${invId}`)
        .set('x-organization-id', mockOrgId)
        .send(payload);

      if (response.status !== 200) {
        console.log('Error Response:', JSON.stringify(response.body, null, 2));
      }

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', invId);
      expect(ActivityLogger.recordUpdate).toHaveBeenCalled();
    });

    it('should fail if invoice is not in draft status', async () => {
      const invId = 'inv-123';
      const mockInvoice = { id: invId, status: 'open', documentNumber: 'INV-001' };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            invoices: {
              findFirst: vi.fn().mockResolvedValue(mockInvoice),
            },
          },
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .patch(`/invoices/${invId}`)
        .set('x-organization-id', mockOrgId)
        .send({ notes: 'fails' });

      expect(response.status).toBe(500);
    });
  });
});
