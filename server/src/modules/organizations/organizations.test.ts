import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { organizationInvites, organizationMemberships } from '../../db/schema/index.js';

// --- MOCKS ---

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

const mockResult = {
  returning: vi.fn().mockResolvedValue([{ id: 'mock-id', name: 'Test Org', slug: 'test-org' }]),
  where: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};

vi.mock('../../db/index.js', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        insert: vi.fn(() => mockResult),
        update: vi.fn(() => mockResult),
        query: {
          organizationInvites: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          organizations: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };
      return await cb(tx);
    }),
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
      organizationMemberships: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organizationInvites: {
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
    })),
  },
}));

// --- TESTS ---

describe('Organizations Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockUserEmail = 'newuser@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /organizations', () => {
    it('should return 401 if unauthorized', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue(null);

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Org', slug: 'new-org' });

      expect(response.status).toBe(401);
    });

    it('should create an organization and return 201', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } });

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
      vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } });
      vi.mocked(db.query.organizationMemberships.findMany).mockResolvedValue([
        {
          role: 'admin',
          organization: { id: mockOrgId, name: 'My Org' },
        },
      ]);

      const response = await request(app).get('/organizations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe('admin');
    });
  });

  describe('Invitations & Memberships (Migrated)', () => {
    describe('POST /organizations/:organizationId/invites', () => {
      it('should return 403 if requester is not an admin', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } });
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: mockUserEmail });

        expect(response.status).toBe(403);
      });

      it('should create an invitation if user does not exist', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } });
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          role: 'admin',
          organizationId: mockOrgId,
        });
        vi.mocked(db.query.user.findFirst).mockResolvedValue(null);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: mockUserEmail, role: 'employee' });

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
          role: 'admin',
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
          });
        });

        await organizationsService.processPendingInvites(mockUserEmail, 'new-user-id');
        expect(mockFindMany).toHaveBeenCalled();
      });
    });

    describe('Organization Management Routes', () => {
      beforeEach(() => {
        vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } });
      });

      it('PATCH /organizations/:organizationId - should update organization', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
              },
              organizations: {
                findFirst: vi.fn().mockResolvedValue(null),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: mockOrgId, name: 'Updated Org' }]),
            })),
          });
        });

        const response = await request(app)
          .patch(`/organizations/${mockOrgId}`)
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
            role: 'admin',
            createdAt: new Date(),
            user: { name: 'Admin User', email: 'admin@test.com', image: null },
          },
        ]);

        const response = await request(app).get(`/organizations/${mockOrgId}/members`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].role).toBe('admin');
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
          });
        });

        const response = await request(app)
          .patch(`/organizations/${mockOrgId}/members/${mockUserId}`)
          .send({ role: 'employee' });

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
          });
        });

        const response = await request(app).delete(
          `/organizations/${mockOrgId}/members/${mockUserId}`,
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Member removed successfully');
      });

      it('POST /organizations/:organizationId/invites/:inviteId/resend - should resend invite', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
              },
              organizationInvites: {
                findFirst: vi.fn().mockResolvedValue({ id: 'invite-1' }),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
            })),
          });
        });

        const response = await request(app).post(
          `/organizations/${mockOrgId}/invites/invite-1/resend`,
        );

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Invitation resent successfully');
      });

      it('DELETE /organizations/:organizationId/invites/:inviteId - should cancel invite', async () => {
        vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
          return await cb({
            query: {
              organizationMemberships: {
                findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
              },
            },
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'invite-1' }]),
            })),
          });
        });

        const response = await request(app).delete(`/organizations/${mockOrgId}/invites/invite-1`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Invitation cancelled successfully');
      });

      it('should correctly handle re-inviting a previously removed member with a different role', async () => {
        // Setup: user exists, but no membership (simulating removed)
        const targetEmail = 'removed@example.com';
        vi.mocked(db.query.user.findFirst).mockResolvedValue({
          id: 'user-removed',
          email: targetEmail,
        });
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          role: 'admin', // requester is admin
        });

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: targetEmail, role: 'admin' });

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
        });
        vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
          role: 'admin', // requester is admin
        });

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: targetEmail, role: 'employee' });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Member added successfully');

        // The service uses .onConflictDoUpdate for organizationInvites
        expect(db.insert).toHaveBeenCalledWith(organizationInvites);
      });
    });
  });
});
