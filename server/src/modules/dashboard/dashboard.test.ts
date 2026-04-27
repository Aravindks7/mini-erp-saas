import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['dashboard:read', 'org:settings:manage']),
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

// Complex mock for db
vi.mock('../../db/index.js', () => {
  const mockDb = {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      dashboardMetrics: {
        findFirst: vi.fn(),
      },
      salesOrders: {
        findMany: vi.fn(),
      },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn(() => ({
                limit: vi.fn().mockResolvedValue([]),
              })),
            })),
          })),
        })),
      })),
    })),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
    transaction: vi.fn((cb) => cb(mockDb)),
  };
  return { db: mockDb };
});

describe('Dashboard Module', () => {
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

  describe('GET /dashboard', () => {
    it('should return 200 and dashboard data', async () => {
      (db.query.dashboardMetrics.findFirst as any).mockResolvedValue({
        totalSales: '1000',
        totalPurchases: '500',
        activeCustomers: 10,
      });
      (db.query.salesOrders.findMany as any).mockResolvedValue([]);

      const response = await request(app).get('/dashboard').set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('metrics');
      expect(response.body).toHaveProperty('lowStockItems');
      expect(response.body).toHaveProperty('recentActivity');
      expect(response.body.metrics.totalSales).toBe('1000');
    });
  });

  describe('POST /dashboard/refresh', () => {
    it('should trigger refresh and return 200', async () => {
      const response = await request(app)
        .post('/dashboard/refresh')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(db.execute).toHaveBeenCalled();
    });
  });
});
