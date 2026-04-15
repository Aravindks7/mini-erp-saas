import { describe, it, expect, vi, beforeEach } from 'vitest';
import { organizationsService } from './organizations.service.js';
import { db } from '../../db/index.js';
import { organizationMemberships } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';

vi.mock('../../db/index.js', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        query: {
          organizationMemberships: {
            findFirst: vi.fn(),
          },
          organizationInvites: {
            findFirst: vi.fn(),
          },
          organizations: {
            findFirst: vi.fn(),
          },
        },
        update: vi.fn(() => ({
          set: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
        })),
        delete: vi.fn(() => ({
          where: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: 'deleted-id' }]),
        })),
        select: vi.fn(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
        })),
      };
      return await cb(tx);
    }),
    query: {
      organizationMemberships: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('OrganizationsService - Admin Methods', () => {
  const adminId = 'admin-123';
  const orgId = 'org-456';
  const targetUserId = 'user-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listMembers', () => {
    it('should list all members with user details', async () => {
      vi.mocked(db.query.organizationMemberships.findMany).mockResolvedValue([
        {
          id: 'membership-1',
          userId: targetUserId,
          organizationId: orgId,
          role: 'employee',
          createdAt: new Date(),
          user: { name: 'Test User', email: 'test@example.com', image: null },
        },
      ]);

      const result = await organizationsService.listMembers(orgId);

      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe('Test User');
      expect(db.query.organizationMemberships.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: eq(organizationMemberships.organizationId, orgId),
        }),
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should throw FORBIDDEN if requester is not admin', async () => {
      // Mock ensureAdmin failure
      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue(null), // Not an admin
            },
          },
        };
        return await cb(tx);
      });

      await expect(
        organizationsService.updateMemberRole({
          adminId,
          organizationId: orgId,
          targetUserId,
          role: 'admin',
        }),
      ).rejects.toThrow('FORBIDDEN');
    });

    it('should throw LAST_ADMIN_LOCKOUT if trying to demote the only admin', async () => {
      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce({ role: 'admin' }) // Requester is admin
                .mockResolvedValueOnce({ id: 'm-1', role: 'admin' }), // Target is admin
            },
          },
          select: vi.fn(() => ({
            from: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([{ count: 1 }]), // Only 1 admin
            })),
          })),
        };
        return await cb(tx);
      });

      await expect(
        organizationsService.updateMemberRole({
          adminId,
          organizationId: orgId,
          targetUserId,
          role: 'employee',
        }),
      ).rejects.toThrow('LAST_ADMIN_LOCKOUT');
    });
  });

  describe('removeMember', () => {
    it('should remove a member if not the last admin', async () => {
      const mockDelete = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
      }));

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi
                .fn()
                .mockResolvedValueOnce({ role: 'admin' }) // Requester is admin
                .mockResolvedValueOnce({ id: 'm-1', role: 'employee' }), // Target is employee
            },
          },
          delete: mockDelete,
        };
        return await cb(tx);
      });

      await organizationsService.removeMember({ adminId, organizationId: orgId, targetUserId });
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('updateOrganization', () => {
    it('should update organization name', async () => {
      const mockUpdate = vi.fn(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: orgId, name: 'New Name' }]),
      }));

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
            },
            organizations: {
              findFirst: vi.fn().mockResolvedValue(null),
            },
          },
          update: mockUpdate,
        };
        return await cb(tx);
      });

      const result = await organizationsService.updateOrganization(adminId, orgId, {
        name: 'New Name',
      });
      expect(result.name).toBe('New Name');
    });
  });

  describe('resendInvite', () => {
    it('should reset invite status to pending', async () => {
      const mockUpdate = vi.fn(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
      }));

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
            },
            organizationInvites: {
              findFirst: vi.fn().mockResolvedValue({ id: 'invite-1', status: 'revoked' }),
            },
          },
          update: mockUpdate,
        };
        return await cb(tx);
      });

      await organizationsService.resendInvite({
        adminId,
        organizationId: orgId,
        inviteId: 'invite-1',
      });
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('cancelInvite', () => {
    it('should set status to revoked', async () => {
      const mockUpdate = vi.fn(() => ({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'invite-1', status: 'revoked' }]),
      }));

      vi.mocked(db.transaction).mockImplementationOnce(async (cb) => {
        const tx = {
          query: {
            organizationMemberships: {
              findFirst: vi.fn().mockResolvedValue({ role: 'admin' }),
            },
          },
          update: mockUpdate,
        };
        return await cb(tx);
      });

      await organizationsService.cancelInvite({
        adminId,
        organizationId: orgId,
        inviteId: 'invite-1',
      });
      expect(mockUpdate).toHaveBeenCalled();
    });
  });
});
