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

vi.mock('../sequences/sequences.service.js', () => ({
  sequencesService: {
    getNextSequence: vi.fn().mockResolvedValue('INV-2026-0001'),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      invoices: {
        findFirst: vi.fn(),
      },
      salesOrders: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi
          .fn()
          .mockResolvedValue([{ id: 'new-invoice-id', documentNumber: 'INV-2026-0001' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'inv-123', status: 'open' }]),
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
        invoices: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ id: 'new-invoice-id', documentNumber: 'INV-2026-0001' }]),
        }),
      })),
      update: vi.fn(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'inv-123', status: 'open' }]),
          }),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Invoices Module', () => {
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

  describe('GET /invoices', () => {
    it('should return 200 and a list of invoices', async () => {
      const mockInvoices = [{ id: 'inv-1', documentNumber: 'INV-001' }];
      (db.query.invoices.findMany as any).mockResolvedValue(mockInvoices);

      const response = await request(app).get('/invoices').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockInvoices);
    });
  });

  describe('POST /invoices', () => {
    it('should create an invoice with valid data', async () => {
      const payload = {
        customerId: '550e8400-e29b-41d4-a716-446655440002',
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
        .post('/invoices')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });
  });

  describe('POST /invoices/from-so/:soId', () => {
    it('should create an invoice from a Sales Order', async () => {
      const soId = '550e8400-e29b-41d4-a716-446655440010';
      const mockSO = {
        id: soId,
        customerId: '550e8400-e29b-41d4-a716-446655440002',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440003',
            quantity: '1',
            unitPrice: '1000',
            taxRateAtOrder: '0.1',
            taxAmount: '100',
          },
        ],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            salesOrders: {
              findFirst: vi.fn().mockResolvedValue(mockSO),
            },
            invoices: {
              findFirst: vi
                .fn()
                .mockResolvedValue({ id: 'new-invoice-id', documentNumber: 'INV-2026-0001' }),
            },
          },
          insert: vi.fn(() => ({
            values: vi.fn().mockReturnValue({
              returning: vi
                .fn()
                .mockResolvedValue([{ id: 'new-invoice-id', documentNumber: 'INV-2026-0001' }]),
            }),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .post(`/invoices/from-so/${soId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(201);
      expect(response.body.documentNumber).toBe('INV-2026-0001');
    });
  });

  describe('PATCH /invoices/:id/status', () => {
    it('should update invoice status', async () => {
      const invId = 'inv-123';
      const response = await request(app)
        .patch(`/invoices/${invId}/status`)
        .set('x-organization-id', mockOrgId)
        .send({ status: 'open' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('open');
    });
  });
});
