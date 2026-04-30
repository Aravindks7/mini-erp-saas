import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['inventory:read', 'inventory:receive']),
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
    getNextSequence: vi.fn().mockResolvedValue('RCT-0001'),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      }),
    })),
    query: {
      receipts: {
        findFirst: vi.fn().mockResolvedValue({ id: '1', lines: [] }),
        findMany: vi.fn().mockResolvedValue([]),
      },
      purchaseOrderLines: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: '1' }]),
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
        receipts: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn().mockResolvedValue({ id: '1', lines: [] }),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Receipts Module', () => {
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

  describe('GET /receipts', () => {
    it('should return 200 and a list of receipts', async () => {
      const mockReceipts = [{ id: '1', receiptNumber: 'RCT-0001' }];
      (db.query.receipts.findMany as any).mockResolvedValue(mockReceipts);

      const response = await request(app).get('/receipts').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockReceipts);
    });
  });

  describe('POST /receipts', () => {
    it('should create a receipt with valid data', async () => {
      const payload = {
        purchaseOrderId: '550e8400-e29b-41d4-a716-446655440000',
        reference: 'PACK-999',
        lines: [
          {
            purchaseOrderLineId: '550e8400-e29b-41d4-a716-446655440001',
            productId: '550e8400-e29b-41d4-a716-446655440002',
            warehouseId: '550e8400-e29b-41d4-a716-446655440003',
            quantityReceived: '10',
          },
        ],
      };

      const response = await request(app)
        .post('/receipts')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /receipts/:id', () => {
    it('should return 204 on successful deletion', async () => {
      const response = await request(app).delete('/receipts/1').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(204);
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /receipts', () => {
    it('should return 204 on successful bulk deletion', async () => {
      const response = await request(app)
        .delete('/receipts')
        .set('x-organization-id', mockOrgId)
        .send({ ids: ['1', '2'] });

      expect(response.status).toBe(204);
      expect(db.transaction).toHaveBeenCalled();
    });
  });
});
