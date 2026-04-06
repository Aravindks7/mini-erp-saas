import { db } from '../../db/index.js';
import {
  organizations,
  organizationMemberships,
  user,
  organizationInvites,
} from '../../db/schema/index.js';
import { and, eq, sql } from 'drizzle-orm';
import { CreateOrganizationInput } from '#shared/contracts/organizations.contract.js';

export class OrganizationsService {
  /**
   * Create a new organization and make the creator its admin.
   */
  async createOrganization(userId: string, data: CreateOrganizationInput) {
    return await db.transaction(async (tx) => {
      // 1. Generate unique slug if not provided
      let slug = data.slug || this.generateSlug(data.name);

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
        .values({ name: data.name, slug: finalSlug })
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

    // 3. Add them to the org
    await db.insert(organizationMemberships).values({
      userId: targetUser.id,
      organizationId: organizationId,
      role: role,
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

    if (existingUser) {
      // If user exists, just add them (or we could still use an invite flow, but direct add is faster)
      return this.addMember(params);
    }

    // 3. Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    await db.insert(organizationInvites).values({
      email: userEmail,
      organizationId,
      invitedById: adminId,
      role,
      expiresAt,
    });

    return { success: true, invited: true };
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
        // 1. Create membership
        await tx.insert(organizationMemberships).values({
          userId: userId,
          organizationId: invite.organizationId,
          role: invite.role,
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
