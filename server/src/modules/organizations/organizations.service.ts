import { db } from '../../db/index.js';
import {
  organizations,
  organizationMemberships,
  user,
  organizationInvites,
} from '../../db/schema/index.js';
import { and, eq, sql, ne } from 'drizzle-orm';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '#shared/contracts/organizations.contract.js';

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
          // Append a short random-ish suffix for collision resolution
          const suffix = Math.random().toString(36).substring(2, 6);
          finalSlug = `${slug}-${suffix}`;

          // Circuit breaker to prevent infinite loops
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

      // 3. Link the current user as an 'admin'
      await tx.insert(organizationMemberships).values({
        userId: userId,
        organizationId: newOrg.id,
        role: 'admin',
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
      },
    });

    return myOrgs.map((m) => ({ ...m.organization, role: m.role }));
  }

  /**
   * Add a member to an organization. Requires requester to be an admin.
   */
  async addMember(params: {
    adminId: string;
    organizationId: string;
    userEmail: string;
    role?: 'admin' | 'employee';
  }) {
    const { adminId, organizationId, userEmail, role = 'employee' } = params;

    // 1. Verify the requester is an admin of this org
    const adminMembership = await db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, adminId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.role, 'admin'),
      ),
    });

    if (!adminMembership) {
      throw new Error('FORBIDDEN');
    }

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
        role: role,
      })
      .onConflictDoUpdate({
        target: [organizationMemberships.userId, organizationMemberships.organizationId],
        set: {
          role: role,
          updatedAt: new Date(),
        },
      });

    return { success: true };
  }

  /**
   * Invite a member by email. If they don't exist, an invitation is created.
   */
  async inviteMember(params: {
    adminId: string;
    organizationId: string;
    userEmail: string;
    role?: 'admin' | 'employee';
  }) {
    const { adminId, organizationId, userEmail, role = 'employee' } = params;

    // 1. Verify requester is admin
    const adminMembership = await db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, adminId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.role, 'admin'),
      ),
    });

    if (!adminMembership) throw new Error('FORBIDDEN');

    // 2. Check if user already exists
    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, userEmail),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    if (existingUser) {
      // If user exists, call addMember and UPSERT invite record to 'accepted'
      await this.addMember(params);

      await db
        .insert(organizationInvites)
        .values({
          email: userEmail,
          organizationId,
          invitedById: adminId,
          role,
          status: 'accepted',
          expiresAt,
        })
        .onConflictDoUpdate({
          target: [organizationInvites.email, organizationInvites.organizationId],
          set: {
            status: 'accepted',
            role,
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
        role,
        status: 'pending',
        expiresAt,
      })
      .onConflictDoUpdate({
        target: [organizationInvites.email, organizationInvites.organizationId],
        set: {
          status: 'pending',
          role,
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
      },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      organizationId: m.organizationId,
      role: m.role,
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
    role: 'admin' | 'employee';
  }) {
    const { adminId, organizationId, targetUserId, role } = params;

    return await db.transaction(async (tx) => {
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      // 2. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new Error('NOT_FOUND');

      // 3. Lockout protection: if changing from admin to employee
      if (targetMembership.role === 'admin' && role === 'employee') {
        const adminCount = await this.getAdminCount(tx, organizationId);
        if (adminCount <= 1) {
          throw new Error('LAST_ADMIN_LOCKOUT');
        }
      }

      // 4. Update role
      await tx
        .update(organizationMemberships)
        .set({ role, updatedAt: new Date() })
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
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      // 2. Get target membership
      const targetMembership = await tx.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, targetUserId),
          eq(organizationMemberships.organizationId, organizationId),
        ),
      });

      if (!targetMembership) throw new Error('NOT_FOUND');

      // 3. Lockout protection
      if (targetMembership.role === 'admin') {
        const adminCount = await this.getAdminCount(tx, organizationId);
        if (adminCount <= 1) {
          throw new Error('LAST_ADMIN_LOCKOUT');
        }
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
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      const updateData: UpdateOrganizationInput & { updatedAt: Date } = {
        ...data,
        updatedAt: new Date(),
      };

      // 2. Handle slug uniqueness if provided
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

      // 3. Update
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
   * Resend an invitation (reset expiry and status).
   */
  async resendInvite(params: { adminId: string; organizationId: string; inviteId: string }) {
    const { adminId, organizationId, inviteId } = params;

    return await db.transaction(async (tx) => {
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      // 2. Get invite
      const invite = await tx.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, organizationId),
        ),
      });

      if (!invite) throw new Error('NOT_FOUND');

      // 3. Reset expiry and status
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
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      // 2. Update status
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
   * List all invitations for an organization.
   */
  async listInvites(adminId: string, organizationId: string) {
    // 1. Verify requester is admin
    const adminMembership = await db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, adminId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.role, 'admin'),
      ),
    });

    if (!adminMembership) throw new Error('FORBIDDEN');

    const invites = await db.query.organizationInvites.findMany({
      where: eq(organizationInvites.organizationId, organizationId),
      orderBy: (invites, { desc }) => [desc(invites.createdAt)],
    });

    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      status: i.status,
      expiresAt: i.expiresAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    }));
  }

  /**
   * Delete an organization and all its data (cascading).
   */
  async deleteOrganization(adminId: string, organizationId: string) {
    return await db.transaction(async (tx) => {
      // 1. Verify requester is admin
      await this.ensureAdmin(tx, adminId, organizationId);

      // 2. Delete the organization
      // Note: memberships, invites, and business data (customers, etc)
      // will be deleted via cascading foreign keys defined in the schema.
      const [deleted] = await tx
        .delete(organizations)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!deleted) throw new Error('NOT_FOUND');

      return { success: true };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async ensureAdmin(tx: any, userId: string, organizationId: string) {
    const membership = await tx.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, organizationId),
        eq(organizationMemberships.role, 'admin'),
      ),
    });

    if (!membership) throw new Error('FORBIDDEN');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getAdminCount(tx: any, organizationId: string): Promise<number> {
    const result = await tx
      .select({ count: sql<number>`count(*)` })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.role, 'admin'),
        ),
      );
    return Number(result[0].count);
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
        // 1. Create/Update membership (idempotency fixes "membership already exists" errors)
        await tx
          .insert(organizationMemberships)
          .values({
            userId: userId,
            organizationId: invite.organizationId,
            role: invite.role,
          })
          .onConflictDoUpdate({
            target: [organizationMemberships.userId, organizationMemberships.organizationId],
            set: {
              role: invite.role,
              updatedAt: new Date(),
            },
          });

        // 2. Mark invite as accepted
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
