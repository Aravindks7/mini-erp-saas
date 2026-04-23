import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { organizationInvites, organizationMemberships } from '../../db/schema/index.js';
import { rbacService } from '../rbac/rbac.service.js';
import { PERMISSIONS } from '#shared/contracts/rbac.contract.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'org:settings:manage',
        'org:members:manage',
        'org:roles:manage',
        'customers:read',
        'customers:create',
        'customers:update',
        'customers:delete',
      ]),
    canDowngrade: vi.fn().mockResolvedValue(true),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../../utils/redis.js', () => ({
  redisClient: {
    get: vi.fn().mockResolvedValue(null),
    setEx: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    incr: vi.fn().mockResolvedValue(1),
    isOpen: true,
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
  const mockResult = {
    returning: vi.fn().mockResolvedValue([{ id: 'mock-id', name: 'Test Org', slug: 'test-org' }]),
    where: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
  };

  const queryMock = {
    organizationMemberships: {
      findFirst: vi.fn().mockResolvedValue({
        roleId: '550e8400-e29b-41d4-a716-446655440001',
        organizationId: 'org-456',
        role: { name: 'admin' },
        organization: { id: 'org-456', name: 'Test Org' },
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    organizationInvites: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue({ id: 'invite-1' }),
    },
    organizations: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    roles: {
      findFirst: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440001' }),
    },
    user: {
      findFirst: vi.fn(),
    },
  };

  return {
    db: {
      transaction: vi.fn(async (cb) => {
        const tx = {
          insert: vi.fn(() => mockResult),
          update: vi.fn(() => mockResult),
          delete: vi.fn(() => mockResult),
          query: queryMock,
        };
        return await cb(tx as any);
      }),
      query: queryMock,
      selectDistinct: vi.fn(() => ({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi
                .fn()
                .mockResolvedValue([
                  { id: 'org:settings:manage' },
                  { id: 'customers:read' },
                  { id: 'customers:create' },
                  { id: 'customers:update' },
                  { id: 'customers:delete' },
                ]),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => mockResult),
      update: vi.fn(() => mockResult),
      delete: vi.fn(() => mockResult),
      execute: vi.fn().mockResolvedValue({}),
    },
  };
});

// --- TESTS ---

describe('Organizations Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockUserEmail = 'newuser@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
      roleId: '550e8400-e29b-41d4-a716-446655440001',
      organizationId: mockOrgId,
      organization: { id: mockOrgId, name: 'Test Org' },
    } as any);
    vi.mocked(rbacService.getPermissions).mockResolvedValue([
      'org:settings:manage',
      'org:members:manage',
      'org:roles:manage',
      'customers:read',
      'customers:create',
      'customers:update',
      'customers:delete',
    ]);
  });

  describe('POST /organizations', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null as any);

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Org', slug: 'new-org' });

      expect(response.status).toBe(401);
    });

    it('should create an organization and return 201', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Org', slug: 'new-org', defaultCountry: 'US' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Org'); // from our mock
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('GET /organizations', () => {
    it('should list user organizations', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      vi.mocked(db.query.organizationMemberships.findMany).mockResolvedValue([
        {
          roleId: '550e8400-e29b-41d4-a716-446655440001',
          role: { name: 'admin' },
          organization: { id: mockOrgId, name: 'My Org', slug: 'my-org' },
        },
      ] as any);

      const response = await request(app).get('/organizations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].roleName).toBe('admin');
    });
  });

  describe('Invitations & Memberships (Migrated)', () => {
    describe('POST /organizations/:organizationId/invites', () => {
      it('should return 403 if requester is not an admin', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .set('x-organization-id', mockOrgId)
          .send({ userEmail: mockUserEmail });

        expect(response.status).toBe(403);
      });

      it('should create an invitation if user does not exist', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          roleId: '550e8400-e29b-41d4-a716-446655440001',
          organizationId: mockOrgId,
          organization: { id: mockOrgId, name: 'Test Org' },
        } as any);
        vi.mocked(db.query.user.findFirst).mockResolvedValue(null as any);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .set('x-organization-id', mockOrgId)
          .send({ userEmail: mockUserEmail, roleId: '550e8400-e29b-41d4-a716-446655440001' });

        expect(response.status).toBe(201);
        expect(db.insert).toHaveBeenCalledWith(organizationInvites);
      });
    });

    describe('Auth Hook: processPendingInvites', () => {
      it('should process pending invites for a registered email', async () => {
        const { organizationsService } = await import('./organizations.service.js');
        const mockInvite = {
          id: 'invite-1',
          organizationId: 'org-1',
          roleId: '550e8400-e29b-41d4-a716-446655440001',
          email: mockUserEmail,
        };

        const mockFindMany = vi.fn().mockResolvedValue([mockInvite]);
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            insert: vi.fn(() => ({
              values: vi.fn().mockReturnThis(),
              onConflictDoUpdate: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'id' }]),
            })),
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'id' }]),
            })),
            query: { organizationInvites: { findMany: mockFindMany } },
          } as any);
        });

        await organizationsService.processPendingInvites(mockUserEmail, 'new-user-id');
        expect(mockFindMany).toHaveBeenCalled();
      });
    });

    describe('Organization Management Routes', () => {
      beforeEach(() => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
      });

      it('PATCH /organizations/:organizationId - should update organization', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' } as any),
              },
              organizations: {
                findFirst: vi.fn().mockResolvedValue(null as any),
              },
              roles: {
                findFirst: vi.fn().mockResolvedValue({ id: 'role-1' } as any),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: mockOrgId, name: 'Updated Org' }]),
            })),
          } as any);
        });

        const response = await request(app)
          .patch(`/organizations/${mockOrgId}`)
          .set('x-organization-id', mockOrgId)
          .send({ name: 'Updated Org' });

        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Updated Org');
      });

      it('GET /organizations/:organizationId/members - should list members', async () => {
        vi.mocked(db.query.organizationMemberships.findMany).mockResolvedValue([
          {
            id: 'm1',
            userId: mockUserId,
            organizationId: mockOrgId,
            roleId: '550e8400-e29b-41d4-a716-446655440001',
            role: { name: 'admin' },
            createdAt: new Date(),
            user: { name: 'Admin User', email: 'admin@test.com', image: null },
          } as any,
        ]);

        const response = await request(app)
          .get(`/organizations/${mockOrgId}/members`)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].roleName).toBe('admin');
      });

      it('PATCH /organizations/:organizationId/members/:userId - should update member role', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ id: 'm1', role: 'admin' }),
              },
            },
            select: vi.fn(() => ({
              from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ count: 2 }]),
              })),
            })),
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'm1' }]),
            })),
          } as any);
        });

        const response = await request(app)
          .patch(`/organizations/${mockOrgId}/members/${mockUserId}`)
          .set('x-organization-id', mockOrgId)
          .send({ roleId: '550e8400-e29b-41d4-a716-446655440001' });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Member role updated successfully');
      });

      it('DELETE /organizations/:organizationId/members/:userId - should remove member', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ id: 'm1', role: 'employee' }),
              },
            },
            delete: vi.fn(() => ({
              where: vi.fn().mockReturnThis(),
            })),
          } as any);
        });

        const response = await request(app)
          .delete(`/organizations/${mockOrgId}/members/${mockUserId}`)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Member removed successfully');
      });

      it('POST /organizations/:organizationId/invites/:inviteId/resend - should resend invite', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' } as any),
              },
              organizationInvites: {
                findFirst: vi.fn().mockResolvedValue({ id: 'invite-1' } as any),
              },
              roles: {
                findFirst: vi.fn().mockResolvedValue({ id: 'role-1' } as any),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
            })),
          } as any);
        });

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites/invite-1/resend`)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Invitation resent successfully');
      });

      it('DELETE /organizations/:organizationId/invites/:inviteId - should cancel invite', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' } as any),
              },
              roles: {
                findFirst: vi.fn().mockResolvedValue({ id: 'role-1' } as any),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'invite-1' }]),
            })),
          } as any);
        });

        const response = await request(app)
          .delete(`/organizations/${mockOrgId}/invites/invite-1`)
          .set('x-organization-id', mockOrgId);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Invitation cancelled successfully');
      });

      it('should correctly handle re-inviting a previously removed member with a different role', async () => {
        // Setup: user exists, but no membership (simulating removed)
        const targetEmail = 'removed@example.com';
        vi.mocked(db.query.user.findFirst).mockResolvedValue({
          id: 'user-removed',
          email: targetEmail,
        } as any);
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          roleId: '550e8400-e29b-41d4-a716-446655440001', // requester is admin
          organizationId: mockOrgId,
          organization: { id: mockOrgId, name: 'Test Org' },
        } as any);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .set('x-organization-id', mockOrgId)
          .send({ userEmail: targetEmail, roleId: '550e8400-e29b-41d4-a716-446655440001' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Member added successfully');

        // Verify membership upsert to 'admin'
        expect(db.insert).toHaveBeenCalledWith(organizationMemberships);
        // Verify invite upsert to 'accepted'
        expect(db.insert).toHaveBeenCalledWith(organizationInvites);
      });

      it('should update stale invitation status to accepted when inviting existing user', async () => {
        const targetEmail = 'stale@example.com';
        vi.mocked(db.query.user.findFirst).mockResolvedValue({
          id: 'user-stale',
          email: targetEmail,
        } as any);
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          roleId: '550e8400-e29b-41d4-a716-446655440001', // requester is admin
          organizationId: mockOrgId,
          organization: { id: mockOrgId, name: 'Test Org' },
        } as any);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .set('x-organization-id', mockOrgId)
          .send({ userEmail: targetEmail, roleId: '550e8400-e29b-41d4-a716-446655440001' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Member added successfully');

        // The service uses .onConflictDoUpdate for organizationInvites
        expect(db.insert).toHaveBeenCalledWith(organizationInvites);
      });
    });
  });
});
