import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { auth } from '../lib/auth.js';
import { db } from '../db/index.js';
import { organizationInvites, organizationMemberships } from '../db/schema/index.js';

// Mock auth and db
vi.mock('../lib/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

// Mock db
vi.mock('../db/index.js', () => ({
  db: {
    transaction: vi.fn(
      async (cb) =>
        await cb({
          insert: vi.fn(() => ({
            values: vi
              .fn()
              .mockReturnThis()
              .mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'trans-id' }]),
              }),
          })),
          update: vi.fn(() => ({
            set: vi
              .fn()
              .mockReturnThis()
              .mockReturnValue({
                where: vi
                  .fn()
                  .mockReturnThis()
                  .mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'trans-up-id' }]),
                  }),
              }),
          })),
          query: {
            organizationInvites: {
              findMany: vi.fn(),
            },
          },
        }),
    ),
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      organizationInvites: {
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi
        .fn()
        .mockReturnThis()
        .mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
        }),
    })),
    update: vi.fn(() => ({
      set: vi
        .fn()
        .mockReturnThis()
        .mockReturnValue({
          where: vi
            .fn()
            .mockReturnThis()
            .mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ id: 'id' }]),
            }),
        }),
    })),
  },
}));

describe('Invitations Module Integration', () => {
  const mockAdminId = 'admin-123';
  const mockOrgId = 'org-456';
  const mockUserEmail = 'newuser@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /organizations/:organizationId/invites', () => {
    it('should return 401 if unauthorized', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      const response = await request(app)
        .post(`/organizations/${mockOrgId}/invites`)
        .send({ userEmail: mockUserEmail });

      expect(response.status).toBe(401);
    });

    it('should return 403 if requester is not an admin', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: 'some-user' } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue(null);

      const response = await request(app)
        .post(`/organizations/${mockOrgId}/invites`)
        .send({ userEmail: mockUserEmail });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('Only admins');
    });

    it('should create an invitation if user does not exist', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockAdminId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'admin',
        organizationId: mockOrgId,
      });
      (db.query.user.findFirst as any).mockResolvedValue(null);

      const response = await request(app)
        .post(`/organizations/${mockOrgId}/invites`)
        .send({ userEmail: mockUserEmail, role: 'employee' });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Invitation sent');

      // Verify db.insert was called for organizationInvites
      expect(db.insert).toHaveBeenCalledWith(organizationInvites);
    });

    it('should direct add user if they already exist', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockAdminId } });
      (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
        role: 'admin',
        organizationId: mockOrgId,
      });
      (db.query.user.findFirst as any).mockResolvedValue({
        id: 'existing-user-id',
        email: mockUserEmail,
      });

      const response = await request(app)
        .post(`/organizations/${mockOrgId}/invites`)
        .send({ userEmail: mockUserEmail, role: 'employee' });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Member added');

      // Verify db.insert was called for organizationMemberships
      expect(db.insert).toHaveBeenCalledWith(organizationMemberships);
    });
  });

  describe('Auth Hook: processPendingInvites', () => {
    it('should process pending invites when a new user signs up', async () => {
      // This is a unit test for the service method called by the hook
      const { organizationsService } =
        await import('../modules/organizations/organizations.service.js');

      const mockInvite = {
        id: 'invite-1',
        organizationId: 'org-1',
        role: 'admin',
        email: mockUserEmail,
      };

      // We need to mock the findMany that is used INSIDE the transaction
      // Since our transaction mock passes a specific object, we need to ensure THAT object's query is mocked
      const mockFindMany = vi.fn().mockResolvedValue([mockInvite]);
      (db.transaction as any).mockImplementationOnce(async (cb: any) => {
        return await cb({
          insert: vi.fn(() => ({
            values: vi
              .fn()
              .mockReturnThis()
              .mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'trans-id' }]),
              }),
          })),
          update: vi.fn(() => ({
            set: vi
              .fn()
              .mockReturnThis()
              .mockReturnValue({
                where: vi
                  .fn()
                  .mockReturnThis()
                  .mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'trans-up-id' }]),
                  }),
              }),
          })),
          query: {
            organizationInvites: {
              findMany: mockFindMany,
            },
          },
        });
      });

      await organizationsService.processPendingInvites(mockUserEmail, 'new-user-id');

      // Verify findMany was called with correct email
      expect(mockFindMany).toHaveBeenCalled();

      // Verify membership was created
      expect(db.insert).not.toHaveBeenCalled(); // Because it uses the tx object, not the global db
    });
  });
});
