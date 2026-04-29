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
      .mockResolvedValue(['shipments:read', 'shipments:create', 'shipments:delete']),
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
    getNextSequence: vi.fn().mockResolvedValue('SHP-2026-0001'),
  },
}));

vi.mock('../../db/index.js', () => {
  const mockTx = {
    query: {
      shipments: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'ship-1', shipmentNumber: 'SHP-2026-0001' }]),
        onConflictDoUpdate: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'lvl-1' }]),
        }),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 'so-1', status: 'shipped' }]),
      }),
    })),
  };

  return {
    db: {
      query: {
        organizationMemberships: {
          findFirst: vi.fn(),
        },
        shipments: {
          findMany: vi.fn().mockResolvedValue([]),
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'ship-1', shipmentNumber: 'SHP-2026-0001' }]),
        }),
      })),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
      transaction: vi.fn((cb) => cb(mockTx)),
    },
  };
});

describe('Shipments Module', () => {
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

  describe('GET /shipments', () => {
    it('should return 200 and a list of shipments', async () => {
      const mockShipments = [{ id: 'ship-1', shipmentNumber: 'SHP-001' }];
      (db.query.shipments.findMany as any).mockResolvedValue(mockShipments);

      const response = await request(app).get('/shipments').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockShipments);
    });
  });

  describe('POST /shipments', () => {
    it('should create a shipment successfully', async () => {
      const payload = {
        salesOrderId: '550e8400-e29b-41d4-a716-446655440002',
        lines: [
          {
            salesOrderLineId: '550e8400-e29b-41d4-a716-446655440003',
            productId: '550e8400-e29b-41d4-a716-446655440004',
            warehouseId: '550e8400-e29b-41d4-a716-446655440005',
            quantityShipped: '10',
          },
        ],
      };

      const response = await request(app)
        .post('/shipments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(db.transaction).toHaveBeenCalled();
      expect(sequencesService.getNextSequence).toHaveBeenCalled();
    });

    it('should return 400 for invalid data', async () => {
      const payload = {
        salesOrderId: 'not-a-uuid',
        lines: [],
      };

      const response = await request(app)
        .post('/shipments')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(400);
    });
  });
});
