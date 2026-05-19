import { db } from '../../db/index.js';
import {
  organizationMemberships,
  roles,
  rolePermissionSets,
  permissionSetItems,
} from '../../db/schema/index.js';
import { and, eq } from 'drizzle-orm';
import { type UpdateMemberRoleInput, PERMISSIONS } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class MembersService {
  /**
   * List all members of an organization.
   * Authoritative Hydration: Includes user details and role details.
   */
  async listMembers(organizationId: string) {
    const members = await db.query.organizationMemberships.findMany({
      where: eq(organizationMemberships.organizationId, organizationId),
      with: {
        user: {
          columns: {
            name: true,
            email: true,
            image: true,
          },
        },
        role: true,
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      roleId: m.roleId,
      roleName: m.role.name,
      joinedAt: m.createdAt.toISOString(),
      user: m.user,
    }));
  }

  /**
   * Update a member's role.
   * Lockout Protection: Prevents removing management permissions from the last admin.
   */
  async updateRole(
    organizationId: string,
    adminId: string,
    targetUserId: string,
    data: UpdateMemberRoleInput,
  ) {
    const { roleId } = data;

    return await db.transaction(async (tx) => {
      // 1. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new AppError('Member not found', 404);

      // 2. Lockout protection
      const canDowngrade = await this.canDowngrade(targetUserId, organizationId, tx);
      if (!canDowngrade) {
        // If they are the last admin, we must ensure the NEW role also has management permissions
        const hasManagement = await this.roleHasPermission(
          roleId,
          PERMISSIONS.ORGANIZATION.MEMBERS,
          tx,
        );
        if (!hasManagement) {
          throw new AppError('LAST_ADMIN_LOCKOUT', 400);
        }
      }

      // 3. Update role
      const [updated] = await tx
        .update(organizationMemberships)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(organizationMemberships.id, targetMembership.id))
        .returning();

      if (updated) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId: adminId,
            entityType: 'membership',
            entityId: updated.id,
            entityDisplayId: targetUserId,
            entityLabel: 'Membership',
            action: 'MEMBER_ROLE_CHANGED',
            reason: 'User role updated within organization.',
          },
          targetMembership,
          { roleId },
        );
      }

      return updated;
    });
  }

  /**
   * Remove a member from the organization.
   */
  async removeMember(organizationId: string, adminId: string, targetUserId: string) {
    return await db.transaction(async (tx) => {
      // 1. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new AppError('Member not found', 404);

      // 2. Lockout protection
      const canRemove = await this.canDowngrade(targetUserId, organizationId, tx);
      if (!canRemove) {
        throw new AppError('LAST_ADMIN_LOCKOUT', 400);
      }

      // 3. Delete membership
      const [deleted] = await tx
        .delete(organizationMemberships)
        .where(eq(organizationMemberships.id, targetMembership.id))
        .returning();

      if (deleted) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId: adminId,
          entityType: 'membership',
          entityId: targetMembership.id,
          entityDisplayId: targetUserId,
          entityLabel: 'Membership',
          action: 'MEMBER_REMOVED',
          reason: 'User removed from organization.',
        });
      }

      return { success: true };
    });
  }

  /**
   * Safety Guardrail: Prevents removal/downgrade of the last admin.
   */
  private async canDowngrade(
    userId: string,
    organizationId: string,
    tx: Transaction,
  ): Promise<boolean> {
    const adminPermission = PERMISSIONS.ORGANIZATION.MEMBERS;

    const admins = await tx
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

  /**
   * Check if a specific role has a specific permission.
   */
  private async roleHasPermission(
    roleId: string,
    permissionId: string,
    tx: Transaction,
  ): Promise<boolean> {
    const result = await tx
      .select({ id: permissionSetItems.permissionId })
      .from(permissionSetItems)
      .innerJoin(
        rolePermissionSets,
        eq(rolePermissionSets.permissionSetId, permissionSetItems.permissionSetId),
      )
      .where(
        and(
          eq(rolePermissionSets.roleId, roleId),
          eq(permissionSetItems.permissionId, permissionId),
        ),
      )
      .limit(1);

    return result.length > 0;
  }
}

export const membersService = new MembersService();
