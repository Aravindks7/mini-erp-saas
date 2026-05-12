import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn().mockResolvedValue(['org:roles:manage']),
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
      permissionSets: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      rolePermissionSets: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-ps-id', name: 'New PS' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'ps-123' }]),
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
        permissionSets: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      transaction: vi.fn((cb) => cb(mockTx)),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

describe('Permission Sets Module', () => {
  const mockOrgId = '550e8400-e29b-41d4-a716-446655440001';
  const mockUserId = '550e8400-e29b-41d4-a716-446655440002';
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

  describe('GET /permission-sets', () => {
    it('should return 200 and a list of sets', async () => {
      const mockSets = [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Read Only',
          organizationId: null,
          items: [],
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Custom',
          organizationId: mockOrgId,
          items: [],
        },
      ];
      (db.query.permissionSets.findMany as any).mockResolvedValue(mockSets);

      const response = await request(app)
        .get('/permission-sets')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('POST /permission-sets', () => {
    it('should create a set and return 201', async () => {
      const payload = {
        name: 'New Set',
        permissions: [
          '550e8400-e29b-41d4-a716-446655440005',
          '550e8400-e29b-41d4-a716-446655440006',
        ],
      };

      (db.query.permissionSets.findFirst as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'New Set',
        organizationId: mockOrgId,
        items: [
          { permissionId: '550e8400-e29b-41d4-a716-446655440005' },
          { permissionId: '550e8400-e29b-41d4-a716-446655440006' },
        ],
      });

      const response = await request(app)
        .post('/permission-sets')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('New Set');
    });
  });

  describe('DELETE /permission-sets/:id', () => {
    it('should return 403 when deleting a global set', async () => {
      const psId = '550e8400-e29b-41d4-a716-446655440008';
      const mockPS = { id: psId, name: 'System Set', organizationId: null, items: [] };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            permissionSets: {
              findFirst: vi.fn().mockResolvedValue(mockPS),
            },
          },
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/permission-sets/${psId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Cannot delete global permission sets');
    });

    it('should return 400 when deleting a set in use', async () => {
      const psId = '550e8400-e29b-41d4-a716-446655440009';
      const mockPS = { id: psId, name: 'In Use Set', organizationId: mockOrgId, items: [] };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            permissionSets: {
              findFirst: vi.fn().mockResolvedValue(mockPS),
            },
            rolePermissionSets: {
              findFirst: vi.fn().mockResolvedValue({ roleId: 'r1' }), // In use
            },
          },
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/permission-sets/${psId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete permission set in use');
    });
  });
});
