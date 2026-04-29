import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { sequencesService } from '../sequences/sequences.service.js';

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

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      receipts: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      }),
    })),
    transaction: vi.fn((cb) =>
      cb({
        insert: vi.fn(() => ({
          values: vi.fn().mockReturnValue({
            onConflictDoUpdate: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
            }),
            returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
          }),
        })),
      }),
    ),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

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
        reference: 'PACK-999',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440001',
            warehouseId: '550e8400-e29b-41d4-a716-446655440002',
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
      expect(sequencesService.getNextSequence).toHaveBeenCalledWith(
        mockOrgId,
        'RCT',
        mockUserId,
        expect.anything(),
      );
    });

    it('should return 400 for invalid input', async () => {
      const payload = {
        reference: 'PACK-999',
        lines: [], // Empty lines
      };

      const response = await request(app)
        .post('/receipts')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });
});
