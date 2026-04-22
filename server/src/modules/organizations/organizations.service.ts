import { db } from '../../db/index.js';
import {
  organizations,
  organizationMemberships,
  user,
  organizationInvites,
  roles,
  rolePermissionSets,
} from '../../db/schema/index.js';
import { and, eq, sql, ne } from 'drizzle-orm';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '#shared/contracts/organizations.contract.js';
import { rbacService } from '../rbac/rbac.service.js';
import { PERMISSIONS, type Permission } from '#shared/index.js';

export class OrganizationsService {
  /**
   * Create a new organization and make the creator its admin.
   */
  async createOrganization(userId: string, data: CreateOrganizationInput) {
    return await db.transaction(async (tx) => {
      // 1. Generate unique slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      // Check for collisions and append suffix if needed
      let isUnique = false;
      let counter = 0;
      let finalSlug = slug;

      while (!isUnique) {
        const existing = await tx.query.organizations.findFirst({
          where: eq(organizations.slug, finalSlug),
        });

        if (!existing) {
          isUnique = true;
        } else {
          counter++;
          const suffix = Math.random().toString(36).substring(2, 6);
          finalSlug = `${slug}-${suffix}`;
          if (counter > 5) throw new Error('Could not generate a unique slug');
        }
      }

      // 2. Create the organization
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          slug: finalSlug,
          defaultCountry: data.defaultCountry,
        })
        .returning();

      if (!newOrg) throw new Error('Failed to create organization');

      // 3. Resolve the "Admin" base role (Global)
      // NOTE: For now we assume a seed script creates a role named "Admin" with isBaseRole=true and organizationId=null.
      const adminRole = await tx.query.roles.findFirst({
        where: and(
          eq(roles.name, 'Admin'),
          eq(roles.isBaseRole, true),
          sql`${roles.organizationId} IS NULL`,
        ),
      });

      if (!adminRole) {
        throw new Error('SYSTEM_ERROR: Base Admin role not found. Please seed the database.');
      }

      // 4. Link the current user as an admin using the resolved roleId
      await tx.insert(organizationMemberships).values({
        userId: userId,
        organizationId: newOrg.id,
        roleId: adminRole.id,
      });

      return newOrg;
    });
  }

  /**
   * Simple slug generator: lowercase and replace non-alphanumeric with hyphens.
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * List all organizations the user is a member of.
   */
  async listMyOrganizations(userId: string) {
    const myOrgs = await db.query.organizationMemberships.findMany({
      where: (m, { eq }) => eq(m.userId, userId),
      with: {
        organization: true,
        role: true,
      },
    });

    return myOrgs.map((m) => ({
      ...m.organization,
      roleId: m.roleId,
      roleName: m.role.name,
    }));
  }

  /**
   * Add a member to an organization. Requires requester to have membership management permission.
   */
  async addMember(params: {
    adminId: string;
    organizationId: string;
    userEmail: string;
    roleId: string;
  }) {
    const { adminId, organizationId, userEmail, roleId } = params;

    // 1. Verify the requester has management permission
    await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

    // 2. Find the user to add
    const targetUser = await db.query.user.findFirst({
      where: eq(user.email, userEmail),
    });

    if (!targetUser) {
      throw new Error('USER_NOT_FOUND');
    }

    // 3. Add them to the org (UPSERT for robustness)
    await db
      .insert(organizationMemberships)
      .values({
        userId: targetUser.id,
        organizationId: organizationId,
        roleId: roleId,
      })
      .onConflictDoUpdate({
        target: [organizationMemberships.userId, organizationMemberships.organizationId],
        set: {
          roleId: roleId,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  }

  /**
   * Invite a member by email.
   */
  async inviteMember(params: {
    adminId: string;
    organizationId: string;
    userEmail: string;
    roleId: string;
  }) {
    const { adminId, organizationId, userEmail, roleId } = params;

    // 1. Verify requester has permission
    await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

    // 2. Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, userEmail),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    if (existingUser) {
      await this.addMember(params);

      await db
        .insert(organizationInvites)
        .values({
          email: userEmail,
          organizationId,
          invitedById: adminId,
          roleId: roleId,
          status: 'accepted',
          expiresAt,
        })
        .onConflictDoUpdate({
          target: [organizationInvites.email, organizationInvites.organizationId],
          set: {
            status: 'accepted',
            roleId,
            expiresAt,
            updatedAt: new Date(),
          },
        });

      return { success: true };
    }

    // 3. Create/Update invitation (UPSERT)
    await db
      .insert(organizationInvites)
      .values({
        email: userEmail,
        organizationId,
        invitedById: adminId,
        roleId,
        status: 'pending',
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [organizationInvites.email, organizationInvites.organizationId],
        set: {
          status: 'pending',
          roleId,
          expiresAt,
          invitedById: adminId,
          updatedAt: new Date(),
        },
      });

    return { success: true, invited: true };
  }

  /**
   * List all members of an organization.
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
   */
  async updateMemberRole(params: {
    adminId: string;
    organizationId: string;
    targetUserId: string;
    roleId: string;
  }) {
    const { adminId, organizationId, targetUserId, roleId } = params;

    return await db.transaction(async (tx) => {
      // 1. Verify requester has permission
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

      // 2. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new Error('NOT_FOUND');

      // 3. Lockout protection using RBACService logic
      const canDowngrade = await rbacService.canDowngrade(targetUserId, organizationId);
      if (!canDowngrade) {
        // We need to check if the NEW role still has management permission
        // If it doesn't, and this was the last admin, we block it.
        const newRolePermissions = await tx.query.rolePermissionSets.findMany({
          where: eq(rolePermissionSets.roleId, roleId),
          with: {
            permissionSet: {
              with: {
                items: true,
              },
            },
          },
        });

        const hasManagement = newRolePermissions.some((rp) =>
          rp.permissionSet.items.some((i) => i.permissionId === PERMISSIONS.ORGANIZATION.MEMBERS),
        );

        if (!hasManagement) {
          throw new Error('LAST_ADMIN_LOCKOUT');
        }
      }

      // 4. Update role
      await tx
        .update(organizationMemberships)
        .set({ roleId, updatedAt: new Date() })
        .where(eq(organizationMemberships.id, targetMembership.id));

      return { success: true };
    });
  }

  /**
   * Remove a member from the organization.
   */
  async removeMember(params: { adminId: string; organizationId: string; targetUserId: string }) {
    const { adminId, organizationId, targetUserId } = params;

    return await db.transaction(async (tx) => {
      // 1. Verify requester has permission
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

      // 2. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new Error('NOT_FOUND');

      // 3. Lockout protection
      const canRemove = await rbacService.canDowngrade(targetUserId, organizationId);
      if (!canRemove) {
        throw new Error('LAST_ADMIN_LOCKOUT');
      }

      // 4. Delete membership
      await tx
        .delete(organizationMemberships)
        .where(eq(organizationMemberships.id, targetMembership.id));

      return { success: true };
    });
  }

  /**
   * Update organization details.
   */
  async updateOrganization(adminId: string, organizationId: string, data: UpdateOrganizationInput) {
    return await db.transaction(async (tx) => {
      // 1. Verify requester has permission
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.SETTINGS);

      const updateData: UpdateOrganizationInput & { updatedAt: Date } = {
        ...data,
        updatedAt: new Date(),
      };

      // 2. Handle slug uniqueness
      if (data.slug) {
        let finalSlug = data.slug;
        let isUnique = false;
        let counter = 0;

        while (!isUnique) {
          const existing = await tx.query.organizations.findFirst({
            where: and(eq(organizations.slug, finalSlug), ne(organizations.id, organizationId)),
          });

          if (!existing) {
            isUnique = true;
          } else {
            counter++;
            const suffix = Math.random().toString(36).substring(2, 6);
            finalSlug = `${data.slug}-${suffix}`;
            if (counter > 5) throw new Error('Could not generate a unique slug');
          }
        }
        updateData.slug = finalSlug;
      }

      const [updated] = await tx
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!updated) throw new Error('NOT_FOUND');

      return updated;
    });
  }

  /**
   * Resend an invitation.
   */
  async resendInvite(params: { adminId: string; organizationId: string; inviteId: string }) {
    const { adminId, organizationId, inviteId } = params;

    return await db.transaction(async (tx) => {
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

      const invite = await tx.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, organizationId),
        ),
      });

      if (!invite) throw new Error('NOT_FOUND');

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await tx
        .update(organizationInvites)
        .set({
          expiresAt,
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(organizationInvites.id, inviteId));

      return { success: true };
    });
  }

  /**
   * Cancel a pending invitation.
   */
  async cancelInvite(params: { adminId: string; organizationId: string; inviteId: string }) {
    const { adminId, organizationId, inviteId } = params;

    return await db.transaction(async (tx) => {
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

      const [updated] = await tx
        .update(organizationInvites)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(
          and(
            eq(organizationInvites.id, inviteId),
            eq(organizationInvites.organizationId, organizationId),
          ),
        )
        .returning();

      if (!updated) throw new Error('NOT_FOUND');

      return { success: true };
    });
  }

  /**
   * List all invitations.
   */
  async listInvites(adminId: string, organizationId: string) {
    await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.MEMBERS);

    const invites = await db.query.organizationInvites.findMany({
      where: eq(organizationInvites.organizationId, organizationId),
      with: {
        role: true,
      },
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    });

    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      roleId: i.roleId,
      roleName: i.role.name,
      status: i.status,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  /**
   * Delete an organization.
   */
  async deleteOrganization(adminId: string, organizationId: string) {
    return await db.transaction(async (tx) => {
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.SETTINGS);

      const [deleted] = await tx
        .delete(organizations)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!deleted) throw new Error('NOT_FOUND');

      return { success: true };
    });
  }

  private async ensurePermission(userId: string, organizationId: string, permission: string) {
    const permissions = await rbacService.getPermissions(userId, organizationId);
    if (!permissions.includes(permission as Permission)) {
      throw new Error('FORBIDDEN');
    }
  }

  /**
   * Process any pending invites for a newly registered user.
   */
  async processPendingInvites(userEmail: string, userId: string) {
    return await db.transaction(async (tx) => {
      const pendingInvites = await tx.query.organizationInvites.findMany({
        where: and(
          eq(organizationInvites.email, userEmail),
          eq(organizationInvites.status, 'pending'),
        ),
      });

      for (const invite of pendingInvites) {
        await tx
          .insert(organizationMemberships)
          .values({
            userId: userId,
            organizationId: invite.organizationId,
            roleId: invite.roleId,
          })
          .onConflictDoUpdate({
            target: [organizationMemberships.userId, organizationMemberships.organizationId],
            set: {
              roleId: invite.roleId,
              updatedAt: new Date(),
            },
          });

        await tx
          .update(organizationInvites)
          .set({ status: 'accepted', updatedAt: new Date() })
          .where(eq(organizationInvites.id, invite.id));
      }

      return { processedCount: pendingInvites.length };
    });
  }
}

export const organizationsService = new OrganizationsService();
