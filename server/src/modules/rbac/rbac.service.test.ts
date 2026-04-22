import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rbacService } from './rbac.service.js';
import { db } from '../../db/index.js';
import { redisClient } from '../../utils/redis.js';
import { roles, permissionSets } from '../../db/schema/index.js';

// --- MOCKS ---

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: { findFirst: vi.fn() },
      roles: { findFirst: vi.fn(), findMany: vi.fn() },
      permissionSets: { findFirst: vi.fn(), findMany: vi.fn() },
      rolePermissionSets: { findFirst: vi.fn() },
      permissions: { findMany: vi.fn() },
    },
    selectDistinct: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn().mockResolvedValue([{ id: 'perm:1' }]),
          })),
        })),
      })),
    })),
    select: vi.fn(),
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
        }),
      }),
    })),
    delete: vi.fn(() => ({
      where: vi.fn().mockResolvedValue([]),
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
  },
}));

const mockTx = {
  insert: vi.fn(() => ({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([{ id: 'tx-new-id' }]),
    }),
  })),
  update: vi.fn(() => ({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  })),
  delete: vi.fn(() => ({
    where: vi.fn().mockResolvedValue([]),
  })),
};

vi.mock('../../utils/redis.js', () => ({
  redisClient: {
    isOpen: true,
    get: vi.fn(),
    setEx: vi.fn(),
    incr: vi.fn(),
  },
}));

describe('RBACService', () => {
  const userId = 'user-1';
  const orgId = 'org-1';

  beforeEach(() => {
    vi.clearAllMocks();
    (redisClient as any).isOpen = true;
  });

  describe('getPermissions (Caching)', () => {
    it('should return cached permissions on hit', async () => {
      vi.mocked(redisClient.get).mockResolvedValueOnce('1'); // version
      vi.mocked(redisClient.get).mockResolvedValueOnce(JSON.stringify(['perm:cached'])); // key

      const result = await rbacService.getPermissions(userId, orgId);

      expect(result).toEqual(['perm:cached']);
    });

    it('should fetch from DB and cache on miss', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        userId,
        organizationId: orgId,
        roleId: 'role-1',
      } as any);

      const result = await rbacService.getPermissions(userId, orgId);

      expect(result).toEqual(['perm:1']);
      expect(redisClient.setEx).toHaveBeenCalled();
    });

    it('should fetch from DB and NOT cache if permissions are empty', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        userId,
        organizationId: orgId,
        roleId: 'role-1',
      } as any);
      vi.mocked(db.selectDistinct).mockReturnValueOnce({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              where: vi.fn().mockResolvedValue([]),
            })),
          })),
        })),
      } as any);

      const result = await rbacService.getPermissions(userId, orgId);

      expect(result).toEqual([]);
      expect(redisClient.setEx).not.toHaveBeenCalled();
    });

    it('should return empty if membership not found', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);
      const result = await rbacService.getPermissions(userId, orgId);
      expect(result).toEqual([]);
    });

    it('should fall back to DB if Redis is closed', async () => {
      (redisClient as any).isOpen = false;
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        userId,
        organizationId: orgId,
        roleId: 'role-1',
      } as any);

      const result = await rbacService.getPermissions(userId, orgId);

      expect(result).toEqual(['perm:1']);
    });

    it('should handle Redis errors gracefully', async () => {
      vi.mocked(redisClient.get).mockRejectedValue(new Error('Redis Error'));
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        userId,
        organizationId: orgId,
        roleId: 'role-1',
      } as any);

      const result = await rbacService.getPermissions(userId, orgId);

      expect(result).toEqual(['perm:1']);
    });
  });

  describe('Permission Sets', () => {
    it('should get a permission set', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'set-1',
        organizationId: orgId,
        items: [{ permissionId: 'p1' }],
      } as any);
      const result = await rbacService.getPermissionSet('set-1', orgId);
      expect(result?.permissions).toEqual(['p1']);
    });

    it('should return null if permission set not found', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue(null as any);
      const result = await rbacService.getPermissionSet('none', orgId);
      expect(result).toBeNull();
    });

    it('should list permission sets', async () => {
      vi.mocked(db.query.permissionSets.findMany).mockResolvedValue([
        { id: 'set-1', items: [{ permissionId: 'p1' }] },
      ] as any);
      const result = await rbacService.listPermissionSets(orgId);
      expect(result[0]!.permissions).toEqual(['p1']);
    });

    it('should create a permission set', async () => {
      const result = await rbacService.createPermissionSet(orgId, {
        name: 'New Set',
        permissions: ['p1'],
      });
      expect(result.id).toBe('tx-new-id');
    });

    it('should fork a global permission set when updating', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'global-set',
        organizationId: null,
        name: 'Global Set',
        items: [],
      } as any);

      await rbacService.updatePermissionSet('global-set', orgId, { name: 'Modified Set' });

      expect(mockTx.insert).toHaveBeenCalledWith(permissionSets);
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });

    it('should update a tenant-owned permission set', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'tenant-set',
        organizationId: orgId,
        items: [],
      } as any);

      await rbacService.updatePermissionSet('tenant-set', orgId, {
        name: 'New Name',
        permissions: ['p2'],
      });

      expect(mockTx.update).toHaveBeenCalled();
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });

    it('should delete a tenant-owned permission set', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'set-1',
        organizationId: orgId,
        items: [],
      } as any);
      vi.mocked(db.query.rolePermissionSets.findFirst).mockResolvedValue(null as any);

      await rbacService.deletePermissionSet('set-1', orgId);
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });
  });

  describe('Roles', () => {
    it('should get a role', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'r1',
        organizationId: orgId,
        permissionSets: [{ permissionSetId: 'ps1' }],
      } as any);
      const result = await rbacService.getRole('r1', orgId);
      expect(result?.permissionSetIds).toEqual(['ps1']);
    });

    it('should return null if role not found', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue(null as any);
      const result = await rbacService.getRole('none', orgId);
      expect(result).toBeNull();
    });

    it('should list roles', async () => {
      vi.mocked(db.query.roles.findMany).mockResolvedValue([
        { id: 'r1', permissionSets: [{ permissionSetId: 'ps1' }] },
      ] as any);
      const result = await rbacService.listRoles(orgId);
      expect(result[0]!.permissionSetIds).toEqual(['ps1']);
    });

    it('should return false if role is not in use', async () => {
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);
      const result = await rbacService.isRoleInUse('r1');
      expect(result).toBe(false);
    });

    it('should create a role', async () => {
      const result = await rbacService.createRole(orgId, {
        name: 'New Role',
        permissionSetIds: ['ps-1'],
      });
      expect(result.id).toBe('tx-new-id');
    });

    it('should fork a global role when updating', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'global-role',
        organizationId: null,
        name: 'Global Admin',
        permissionSets: [],
      } as any);

      await rbacService.updateRole('global-role', orgId, { name: 'Modified Admin' });

      expect(mockTx.insert).toHaveBeenCalledWith(roles);
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });

    it('should update a tenant-owned role', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'tenant-role',
        organizationId: orgId,
        permissionSets: [],
      } as any);

      await rbacService.updateRole('tenant-role', orgId, {
        name: 'New Name',
        permissionSetIds: ['ps2'],
      });

      expect(mockTx.update).toHaveBeenCalled();
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });

    it('should delete a tenant-owned role', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'tenant-role',
        organizationId: orgId,
        permissionSets: [],
      } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue(null as any);

      await rbacService.deleteRole('tenant-role', orgId);
      expect(redisClient.incr).toHaveBeenCalledWith(`rbac:permver:${orgId}`);
    });
  });

  describe('Safety Guardrails', () => {
    it('canDowngrade should return false for the last admin', async () => {
      const mockAdmins = [{ userId: 'admin-1' }];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  groupBy: vi.fn().mockResolvedValue(mockAdmins),
                })),
              })),
            })),
          })),
        })),
      } as any);

      const result = await rbacService.canDowngrade('admin-1', orgId);
      expect(result).toBe(false);
    });

    it('canDowngrade should return true if multiple admins exist', async () => {
      const mockAdmins = [{ userId: 'admin-1' }, { userId: 'admin-2' }];
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            innerJoin: vi.fn(() => ({
              innerJoin: vi.fn(() => ({
                where: vi.fn(() => ({
                  groupBy: vi.fn().mockResolvedValue(mockAdmins),
                })),
              })),
            })),
          })),
        })),
      } as any);

      const result = await rbacService.canDowngrade('admin-1', orgId);
      expect(result).toBe(true);
    });

    it('should prevent deleting global sets', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'global-set',
        organizationId: null,
        items: [],
      } as any);
      await expect(rbacService.deletePermissionSet('global-set', orgId)).rejects.toThrow(
        'Cannot delete global permission sets',
      );
    });

    it('should prevent deleting sets in use', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'tenant-set',
        organizationId: orgId,
        items: [],
      } as any);
      vi.mocked(db.query.rolePermissionSets.findFirst).mockResolvedValue({ roleId: 'r1' } as any);
      await expect(rbacService.deletePermissionSet('tenant-set', orgId)).rejects.toThrow(
        'Cannot delete permission set in use',
      );
    });

    it('should prevent deleting global roles', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'global-role',
        organizationId: null,
        permissionSets: [],
      } as any);
      await expect(rbacService.deleteRole('global-role', orgId)).rejects.toThrow(
        'Cannot delete global roles',
      );
    });

    it('should prevent deleting roles in use', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'tenant-role',
        organizationId: orgId,
        permissionSets: [],
      } as any);
      vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
        id: 'membership',
      } as any);
      await expect(rbacService.deleteRole('tenant-role', orgId)).rejects.toThrow(
        'Cannot delete role in use',
      );
    });

    it('should get a global role', async () => {
      vi.mocked(db.query.roles.findFirst).mockResolvedValue({
        id: 'global-role',
        organizationId: null,
        permissionSets: [],
      } as any);
      const result = await rbacService.getRole('global-role', orgId);
      expect(result?.organizationId).toBeNull();
    });

    it('should get a global permission set', async () => {
      vi.mocked(db.query.permissionSets.findFirst).mockResolvedValue({
        id: 'global-set',
        organizationId: null,
        items: [],
      } as any);
      const result = await rbacService.getPermissionSet('global-set', orgId);
      expect(result?.organizationId).toBeNull();
    });
  });
});
