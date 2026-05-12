import { db } from '../../db/index.js';
import { permissionSets, permissionSetItems, rolePermissionSets } from '../../db/schema/index.js';
import { and, eq, or, sql } from 'drizzle-orm';
import { type CreatePermissionSetInput, type UpdatePermissionSetInput } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';
import { ActivityLogger } from '../../lib/activity-logger.js';
import { rbacCacheService } from '../rbac/rbac-cache.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class PermissionSetsService {
  /**
   * Get a single permission set by ID.
   * Authoritative Hydration: Includes granular permission strings.
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
   * Create a new permission set for an organization.
   */
  async createPermissionSet(
    organizationId: string,
    userId: string,
    data: CreatePermissionSetInput,
  ) {
    return await db.transaction(async (tx) => {
      const [newSet] = await tx
        .insert(permissionSets)
        .values({
          name: data.name,
          organizationId,
          isBaseSet: false,
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

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'permission_set',
        entityId: newSet.id,
        entityDisplayId: newSet.name,
        entityLabel: 'Permission Set',
        action: 'PERMISSION_SET_CREATED',
        reason: `Permission set '${newSet.name}' created with ${data.permissions.length} permissions.`,
      });

      // Return fully hydrated object
      return this.getPermissionSet(newSet.id, organizationId);
    });
  }

  /**
   * Update a permission set.
   * Copy-on-Write (CoW) Logic: If editing a Global/System set, create a new record for this tenant.
   */
  async updatePermissionSet(
    id: string,
    organizationId: string,
    userId: string,
    data: UpdatePermissionSetInput,
  ) {
    const original = await this.getPermissionSet(id, organizationId);
    if (!original) throw new AppError('Permission set not found', 404);

    return await db.transaction(async (tx) => {
      // CoW Logic
      if (original.organizationId === null) {
        const [newSet] = await tx
          .insert(permissionSets)
          .values({
            name: data.name ?? original.name,
            organizationId,
            isBaseSet: false,
          })
          .returning();

        if (!newSet) throw new AppError('Failed to copy permission set', 500);

        const permissionsToUse = data.permissions ?? original.permissions;
        await tx.insert(permissionSetItems).values(
          permissionsToUse.map((p) => ({
            permissionSetId: newSet.id,
            permissionId: p,
          })),
        );

        await rbacCacheService.invalidateTenant(organizationId);

        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'permission_set',
          entityId: newSet.id,
          entityDisplayId: newSet.name,
          entityLabel: 'Permission Set',
          action: 'PERMISSION_SET_CREATED',
          reason: `System permission set '${original.name}' customized for organization.`,
        });

        return this.getPermissionSet(newSet.id, organizationId);
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

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'permission_set',
          entityId: id,
          entityDisplayId: original.name,
          entityLabel: 'Permission Set',
          action: 'PERMISSION_SET_UPDATED',
          reason: 'Permission set permissions modified.',
        },
        original,
        data,
      );

      return this.getPermissionSet(id, organizationId);
    });
  }

  /**
   * Delete a permission set after checking usage guards.
   */
  async deletePermissionSet(id: string, organizationId: string, userId: string) {
    const set = await this.getPermissionSet(id, organizationId);
    if (!set) throw new AppError('Permission set not found', 404);

    if (set.organizationId === null) {
      throw new AppError('Cannot delete global permission sets', 403);
    }

    // Usage guard
    const inUse = await db.query.rolePermissionSets.findFirst({
      where: eq(rolePermissionSets.permissionSetId, id),
    });
    if (inUse) {
      throw new AppError('Cannot delete permission set in use by roles', 400);
    }

    return await db.transaction(async (tx) => {
      await tx.delete(permissionSetItems).where(eq(permissionSetItems.permissionSetId, id));
      await tx
        .delete(permissionSets)
        .where(and(eq(permissionSets.id, id), eq(permissionSets.organizationId, organizationId)));

      await rbacCacheService.invalidateTenant(organizationId);

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'permission_set',
        entityId: id,
        entityDisplayId: set.name,
        entityLabel: 'Permission Set',
        action: 'PERMISSION_SET_DELETED',
        reason: `Permission set '${set.name}' deleted.`,
      });
    });
  }
}

export const permissionSetsService = new PermissionSetsService();
