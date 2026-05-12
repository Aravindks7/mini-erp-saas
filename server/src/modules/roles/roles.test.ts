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
      roles: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organizationMemberships: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-role-id', name: 'New Role' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'role-123' }]),
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
        roles: {
          findFirst: vi.fn(),
          findMany: vi.fn(),
        },
      },
      transaction: vi.fn((cb) => cb(mockTx)),
      execute: vi.fn().mockResolvedValue({ rows: [] }),
    },
  };
});

describe('Roles Module', () => {
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

  describe('GET /roles', () => {
    it('should return 200 and a list of roles', async () => {
      const mockRoles = [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Admin',
          organizationId: null,
          permissionSets: [],
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Editor',
          organizationId: mockOrgId,
          permissionSets: [],
        },
      ];
      (db.query.roles.findMany as any).mockResolvedValue(mockRoles);

      const response = await request(app).get('/roles').set('x-organization-id', mockOrgId);

      if (response.status !== 200) console.log('DEBUG:', response.status, response.body);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Admin');
    });
  });

  describe('POST /roles', () => {
    it('should create a role and return 201', async () => {
      const payload = {
        name: 'Manager',
        permissionSetIds: ['550e8400-e29b-41d4-a716-446655440005'],
      };

      // Mock the findFirst call in getRole after creation
      (db.query.roles.findFirst as any).mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440006',
        name: 'Manager',
        organizationId: mockOrgId,
        permissionSets: [{ permissionSetId: '550e8400-e29b-41d4-a716-446655440005' }],
      });

      const response = await request(app)
        .post('/roles')
        .set('x-organization-id', mockOrgId)
        .send(payload);

      if (response.status !== 201) console.log('DEBUG POST:', response.status, response.body);

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Manager');
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('DELETE /roles/:id', () => {
    it('should delete a tenant-owned role successfully', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440007';
      const mockRole = {
        id: roleId,
        name: 'Old Role',
        organizationId: mockOrgId,
        permissionSets: [],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            roles: {
              findFirst: vi.fn().mockResolvedValue(mockRole),
            },
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue(null), // Not in use
            },
          },
          delete: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([]),
          })),
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/roles/${roleId}`)
        .set('x-organization-id', mockOrgId);

      if (response.status !== 204) console.log('DEBUG DELETE:', response.status, response.body);

      expect(response.status).toBe(204);
    });

    it('should return 403 when deleting a global role', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440008';
      const mockRole = {
        id: roleId,
        name: 'System Admin',
        organizationId: null,
        permissionSets: [],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            roles: {
              findFirst: vi.fn().mockResolvedValue(mockRole),
            },
          },
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/roles/${roleId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Cannot delete global roles');
    });

    it('should return 400 when deleting a role in use', async () => {
      const roleId = '550e8400-e29b-41d4-a716-446655440009';
      const mockRole = {
        id: roleId,
        name: 'Active Role',
        organizationId: mockOrgId,
        permissionSets: [],
      };

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            roles: {
              findFirst: vi.fn().mockResolvedValue(mockRole),
            },
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue({ id: 'm1' }), // In use
            },
          },
        } as any;
        return cb(tx);
      });

      const response = await request(app)
        .delete(`/roles/${roleId}`)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Cannot delete role in use by users');
    });
  });
});
