import { db } from '../../db/index.js';
import {
  organizationMemberships,
  roles,
  rolePermissionSets,
  permissionSetItems,
} from '../../db/schema/index.js';
import { and, eq } from 'drizzle-orm';
import { type Permission } from '#shared/index.js';
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
}

export const rbacService = new RBACService();
