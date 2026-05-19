import { db } from '../../db/index.js';
import { roles, rolePermissionSets, organizationMemberships } from '../../db/schema/index.js';
import { and, eq, or, sql } from 'drizzle-orm';
import { type CreateRoleInput, type UpdateRoleInput } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';
import { ActivityLogger } from '../../lib/activity-logger.js';
import { rbacCacheService } from '../rbac/rbac-cache.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class RolesService {
  /**
   * Get a single role by ID.
   * Authoritative Hydration: Includes linked permission set IDs.
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
   * Create a new role for an organization.
   */
  async createRole(organizationId: string, userId: string, data: CreateRoleInput) {
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

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'role',
        entityId: newRole.id,
        entityDisplayId: newRole.name,
        entityLabel: 'Role',
        action: 'ROLE_CREATED',
        reason: `Role '${newRole.name}' created with ${data.permissionSetIds.length} permission sets.`,
      });

      return this.getRole(newRole.id, organizationId);
    });
  }

  /**
   * Update a role.
   * Copy-on-Write (CoW) Logic: If editing a Global/System role, create a new record for this tenant.
   */
  async updateRole(id: string, organizationId: string, userId: string, data: UpdateRoleInput) {
    const original = await this.getRole(id, organizationId);
    if (!original) throw new AppError('Role not found', 404);

    return await db.transaction(async (tx) => {
      // CoW Logic
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

        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'role',
          entityId: newRole.id,
          entityDisplayId: newRole.name,
          entityLabel: 'Role',
          action: 'ROLE_CREATED',
          reason: `System role '${original.name}' customized for organization.`,
        });

        return this.getRole(newRole.id, organizationId);
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

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'role',
          entityId: id,
          entityDisplayId: original.name,
          entityLabel: 'Role',
          action: 'ROLE_UPDATED',
          reason: 'Role assignments modified.',
        },
        original,
        data,
      );

      return this.getRole(id, organizationId);
    });
  }

  /**
   * Delete a role after checking usage guards.
   */
  async deleteRole(id: string, organizationId: string, userId: string) {
    const role = await this.getRole(id, organizationId);
    if (!role) throw new AppError('Role not found', 404);

    if (role.organizationId === null) {
      throw new AppError('Cannot delete global roles', 403);
    }

    // Usage guard
    const inUse = await db.query.organizationMemberships.findFirst({
      where: eq(organizationMemberships.roleId, id),
    });
    if (inUse) {
      throw new AppError('Cannot delete role in use by users', 400);
    }

    return await db.transaction(async (tx) => {
      await tx.delete(rolePermissionSets).where(eq(rolePermissionSets.roleId, id));
      await tx.delete(roles).where(and(eq(roles.id, id), eq(roles.organizationId, organizationId)));

      await rbacCacheService.invalidateTenant(organizationId);

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'role',
        entityId: id,
        entityDisplayId: role.name,
        entityLabel: 'Role',
        action: 'ROLE_DELETED',
        reason: `Role '${role.name}' deleted.`,
      });
    });
  }
}

export const rolesService = new RolesService();
