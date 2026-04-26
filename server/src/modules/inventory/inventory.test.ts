import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { sequencesService } from '../sequences/sequences.service.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['inventory:read', 'inventory:adjust']),
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
    getNextSequence: vi.fn().mockResolvedValue('ADJ-0001'),
  },
}));

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      inventoryLevels: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      inventoryAdjustments: {
        findMany: vi.fn().mockResolvedValue([]),
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

describe('Inventory Module', () => {
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

  describe('GET /inventory/levels', () => {
    it('should return 200 and a list of inventory levels', async () => {
      const mockLevels = [{ id: '1', productId: 'p1', quantityOnHand: '10' }];
      (db.query.inventoryLevels.findMany as any).mockResolvedValue(mockLevels);

      const response = await request(app)
        .get('/inventory/levels')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLevels);
    });
  });

  describe('GET /inventory/adjustments', () => {
    it('should return 200 and a list of adjustments', async () => {
      const mockAdjustments = [{ id: 'adj-1', reason: 'Test' }];
      (db.query.inventoryAdjustments.findMany as any).mockResolvedValue(mockAdjustments);

      const response = await request(app)
        .get('/inventory/adjustments')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAdjustments);
    });
  });

  describe('POST /inventory/adjustments', () => {
    it('should create an adjustment with valid data', async () => {
      const payload = {
        reason: 'Cycle Count',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440001',
            warehouseId: '550e8400-e29b-41d4-a716-446655440002',
            quantityChange: '5',
          },
        ],
      };

      const response = await request(app)
        .post('/inventory/adjustments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });

    it('should return 400 for negative stock if database throws check violation', async () => {
      // Mock db.transaction to throw a check violation error
      vi.mocked(db.transaction).mockRejectedValueOnce({
        code: '23514',
      });

      const payload = {
        reason: 'Cycle Count',
        lines: [
          {
            productId: '550e8400-e29b-41d4-a716-446655440001',
            warehouseId: '550e8400-e29b-41d4-a716-446655440002',
            quantityChange: '-100',
          },
        ],
      };

      const response = await request(app)
        .post('/inventory/adjustments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('cannot be negative');
    });

    it('should return 400 for invalid UUIDs', async () => {
      const payload = {
        reason: 'Cycle Count',
        lines: [
          {
            productId: 'invalid-uuid',
            warehouseId: '00000000-0000-0000-0000-000000000002',
            quantityChange: '5',
          },
        ],
      };

      const response = await request(app)
        .post('/inventory/adjustments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });
});
