import { db } from '../../db/index.js';
import {
  organizationMemberships,
  roles,
  rolePermissionSets,
  permissionSetItems,
  permissionSets,
} from '../../db/schema/index.js';
import { and, eq, or, sql } from 'drizzle-orm';
import {
  type Permission,
  PERMISSIONS,
  type CreatePermissionSetInput,
  type CreateRoleInput,
  type UpdatePermissionSetInput,
  type UpdateRoleInput,
} from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';
import { rbacCacheService } from './rbac-cache.service.js';

export class RBACService {
  /**
   * Resolves all unique permissions for a user within an organization.
   * Logic: Check Cache -> DB Fallback -> Store in Cache.
   */
  async getPermissions(userId: string, organizationId: string): Promise<Permission[]> {
    // Step 1: Attempt to fetch from Redis
    const cached = await rbacCacheService.getCachedPermissions(userId, organizationId);
    if (cached) return cached;

    // Step 2: DB Fallback
    const membership = await db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
      ),
    });

    if (!membership) return [];

    const result = await db
      .selectDistinct({ id: permissionSetItems.permissionId })
      .from(permissionSetItems)
      .innerJoin(
        rolePermissionSets,
        eq(rolePermissionSets.permissionSetId, permissionSetItems.permissionSetId),
      )
      .innerJoin(roles, eq(roles.id, rolePermissionSets.roleId))
      .where(eq(roles.id, membership.roleId));

    const permissions = result.map((r) => r.id as Permission);

    // Step 3: Memoize in Redis
    if (permissions.length > 0) {
      await rbacCacheService.cachePermissions(userId, organizationId, permissions);
    }

    return permissions;
  }

  /**
   * List all available granular permissions (Static).
   */
  async listAllPermissions() {
    return await db.query.permissions.findMany();
  }

  /**
   * Get a single permission set by ID.
   */
  async getPermissionSet(id: string, organizationId: string) {
    const set = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.id, id),
        or(
          sql`${permissionSets.organizationId} IS NULL`,
          eq(permissionSets.organizationId, organizationId),
        ),
      ),
      with: {
        items: true,
      },
    });

    if (!set) return null;

    return {
      ...set,
      permissions: set.items.map((i) => i.permissionId),
    };
  }

  /**
   * List permission sets available to an organization (Global + Tenant-specific).
   */
  async listPermissionSets(organizationId: string) {
    const sets = await db.query.permissionSets.findMany({
      where: or(
        sql`${permissionSets.organizationId} IS NULL`,
        eq(permissionSets.organizationId, organizationId),
      ),
      with: {
        items: true,
      },
    });

    return sets.map((s) => ({
      ...s,
      permissions: s.items.map((i) => i.permissionId),
    }));
  }

  /**
   * Checks if a permission set is currently assigned to any role.
   */
  async isPermissionSetInUse(setId: string): Promise<boolean> {
    const usage = await db.query.rolePermissionSets.findFirst({
      where: eq(rolePermissionSets.permissionSetId, setId),
    });
    return !!usage;
  }

  /**
   * Create a new permission set for an organization.
   */
  async createPermissionSet(organizationId: string, data: CreatePermissionSetInput) {
    return await db.transaction(async (tx) => {
      const [newSet] = await tx
        .insert(permissionSets)
        .values({
          name: data.name,
          organizationId,
        })
        .returning();

      if (!newSet) throw new AppError('Failed to create permission set', 500);

      if (data.permissions.length > 0) {
        await tx.insert(permissionSetItems).values(
          data.permissions.map((p) => ({
            permissionSetId: newSet.id,
            permissionId: p,
          })),
        );
      }

      return newSet;
    });
  }

  /**
   * Update a permission set.
   * If the set is Global (organizationId is NULL), copy it to the current organization (CoW).
   */
  async updatePermissionSet(id: string, organizationId: string, data: UpdatePermissionSetInput) {
    const original = await this.getPermissionSet(id, organizationId);
    if (!original) throw new AppError('Permission set not found', 404);

    return await db.transaction(async (tx) => {
      // Copy-on-Write Logic: If editing a Global/System set, create a new record for this tenant.
      if (original.organizationId === null) {
        const [newSet] = await tx
          .insert(permissionSets)
          .values({
            name: data.name ?? original.name,
            organizationId,
          })
          .returning();

        if (!newSet) throw new AppError('Failed to copy permission set', 500);

        const permissionsToUse = data.permissions ?? original.permissions;
        if (permissionsToUse.length > 0) {
          await tx.insert(permissionSetItems).values(
            permissionsToUse.map((p) => ({
              permissionSetId: newSet.id,
              permissionId: p,
            })),
          );
        }
        await rbacCacheService.invalidateTenant(organizationId);
        return newSet;
      }

      // If tenant-owned, update original
      if (data.name) {
        await tx
          .update(permissionSets)
          .set({ name: data.name })
          .where(and(eq(permissionSets.id, id), eq(permissionSets.organizationId, organizationId)));
      }

      if (data.permissions) {
        await tx.delete(permissionSetItems).where(eq(permissionSetItems.permissionSetId, id));

        if (data.permissions.length > 0) {
          await tx.insert(permissionSetItems).values(
            data.permissions.map((p) => ({
              permissionSetId: id,
              permissionId: p,
            })),
          );
        }
      }

      await rbacCacheService.invalidateTenant(organizationId);
      return original;
    });
  }

  /**
   * Delete a permission set after checking usage guards.
   */
  async deletePermissionSet(id: string, organizationId: string) {
    const set = await this.getPermissionSet(id, organizationId);
    if (!set) throw new AppError('Permission set not found', 404);

    if (set.organizationId === null) {
      throw new AppError('Cannot delete global permission sets', 403);
    }

    const inUse = await this.isPermissionSetInUse(id);
    if (inUse) {
      throw new AppError('Cannot delete permission set in use by roles', 400);
    }

    return await db.transaction(async (tx) => {
      await tx.delete(permissionSetItems).where(eq(permissionSetItems.permissionSetId, id));
      await tx
        .delete(permissionSets)
        .where(and(eq(permissionSets.id, id), eq(permissionSets.organizationId, organizationId)));

      await rbacCacheService.invalidateTenant(organizationId);
    });
  }

  /**
   * Get a single role by ID.
   */
  async getRole(id: string, organizationId: string) {
    const role = await db.query.roles.findFirst({
      where: and(
        eq(roles.id, id),
        or(sql`${roles.organizationId} IS NULL`, eq(roles.organizationId, organizationId)),
      ),
      with: {
        permissionSets: true,
      },
    });

    if (!role) return null;

    return {
      ...role,
      permissionSetIds: role.permissionSets.map((ps) => ps.permissionSetId),
    };
  }

  /**
   * List roles available to an organization (Global + Tenant-specific).
   */
  async listRoles(organizationId: string) {
    const orgRoles = await db.query.roles.findMany({
      where: or(sql`${roles.organizationId} IS NULL`, eq(roles.organizationId, organizationId)),
      with: {
        permissionSets: true,
      },
    });

    return orgRoles.map((r) => ({
      ...r,
      permissionSetIds: r.permissionSets.map((ps) => ps.permissionSetId),
    }));
  }

  /**
   * Checks if a role is currently assigned to any user membership.
   */
  async isRoleInUse(roleId: string): Promise<boolean> {
    const usage = await db.query.organizationMemberships.findFirst({
      where: eq(organizationMemberships.roleId, roleId),
    });
    return !!usage;
  }

  /**
   * Create a new role for an organization.
   */
  async createRole(organizationId: string, data: CreateRoleInput) {
    return await db.transaction(async (tx) => {
      const [newRole] = await tx
        .insert(roles)
        .values({
          name: data.name,
          organizationId,
          isBaseRole: false,
        })
        .returning();

      if (!newRole) throw new AppError('Failed to create role', 500);

      if (data.permissionSetIds.length > 0) {
        await tx.insert(rolePermissionSets).values(
          data.permissionSetIds.map((psId) => ({
            roleId: newRole.id,
            permissionSetId: psId,
          })),
        );
      }

      return newRole;
    });
  }

  /**
   * Update a role.
   * If the role is Global (organizationId is NULL), copy it to the current organization (CoW).
   */
  async updateRole(id: string, organizationId: string, data: UpdateRoleInput) {
    const original = await this.getRole(id, organizationId);
    if (!original) throw new AppError('Role not found', 404);

    return await db.transaction(async (tx) => {
      // Copy-on-Write Logic: If editing a Global/System role, create a new record for this tenant.
      if (original.organizationId === null) {
        const [newRole] = await tx
          .insert(roles)
          .values({
            name: data.name ?? original.name,
            organizationId,
            isBaseRole: false,
          })
          .returning();

        if (!newRole) throw new AppError('Failed to copy role', 500);

        const setsToUse = data.permissionSetIds ?? original.permissionSetIds;
        if (setsToUse.length > 0) {
          await tx.insert(rolePermissionSets).values(
            setsToUse.map((psId) => ({
              roleId: newRole.id,
              permissionSetId: psId,
            })),
          );
        }
        await rbacCacheService.invalidateTenant(organizationId);
        return newRole;
      }

      // If tenant-owned, update original
      if (data.name) {
        await tx
          .update(roles)
          .set({ name: data.name })
          .where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));
      }

      if (data.permissionSetIds) {
        await tx.delete(rolePermissionSets).where(eq(rolePermissionSets.roleId, id));

        if (data.permissionSetIds.length > 0) {
          await tx.insert(rolePermissionSets).values(
            data.permissionSetIds.map((psId) => ({
              roleId: id,
              permissionSetId: psId,
            })),
          );
        }
      }

      await rbacCacheService.invalidateTenant(organizationId);
      return original;
    });
  }

  /**
   * Delete a role after checking usage guards.
   */
  async deleteRole(id: string, organizationId: string) {
    const role = await this.getRole(id, organizationId);
    if (!role) throw new AppError('Role not found', 404);

    if (role.organizationId === null) {
      throw new AppError('Cannot delete global roles', 403);
    }

    const inUse = await this.isRoleInUse(id);
    if (inUse) {
      throw new AppError('Cannot delete role in use by users', 400);
    }

    return await db.transaction(async (tx) => {
      await tx.delete(rolePermissionSets).where(eq(rolePermissionSets.roleId, id));
      await tx.delete(roles).where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));

      await rbacCacheService.invalidateTenant(organizationId);
    });
  }

  /**
   * Safety Guardrail: Prevents removal/downgrade of the last admin.
   */
  async canDowngrade(userId: string, organizationId: string): Promise<boolean> {
    const adminPermission = PERMISSIONS.ORGANIZATION.MEMBERS;

    const admins = await db
      .select({ userId: organizationMemberships.userId })
      .from(organizationMemberships)
      .innerJoin(roles, eq(roles.id, organizationMemberships.roleId))
      .innerJoin(rolePermissionSets, eq(rolePermissionSets.roleId, roles.id))
      .innerJoin(
        permissionSetItems,
        eq(permissionSetItems.permissionSetId, rolePermissionSets.permissionSetId),
      )
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(permissionSetItems.permissionId, adminPermission),
        ),
      )
      .groupBy(organizationMemberships.userId);

    const isAdmin = admins.some((a) => a.userId === userId);
    if (isAdmin && admins.length <= 1) {
      return false;
    }

    return true;
  }
}

export const rbacService = new RBACService();
