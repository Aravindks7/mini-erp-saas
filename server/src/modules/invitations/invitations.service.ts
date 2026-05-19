import { db } from '../../db/index.js';
import { organizationInvites, organizationMemberships, user } from '../../db/schema/index.js';
import { and, eq } from 'drizzle-orm';
import { type InviteMemberInput, type ActivityAction } from '#shared/index.js';
import { AppError } from '../../utils/AppError.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class InvitationsService {
  /**
   * List all invitations for an organization.
   */
  async listInvites(organizationId: string) {
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
   * Invite a member by email.
   * If the user already exists, they are added directly to the organization.
   * Otherwise, a pending invitation is created.
   */
  async inviteMember(organizationId: string, adminId: string, data: InviteMemberInput) {
    return await db.transaction(async (tx) => {
      const { userEmail, roleId } = data;

      // 1. Check if user already exists
      const existingUser = await tx.query.user.findFirst({
        where: eq(user.email, userEmail),
      });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      if (existingUser) {
        // Direct add via membership
        const [membership] = await tx
          .insert(organizationMemberships)
          .values({
            userId: existingUser.id,
            organizationId,
            roleId,
          })
          .onConflictDoUpdate({
            target: [organizationMemberships.userId, organizationMemberships.organizationId],
            set: {
              roleId,
              updatedAt: new Date(),
            },
          })
          .returning();

        if (!membership) throw new AppError('Failed to join organization', 500);

        await tx
          .insert(organizationInvites)
          .values({
            email: userEmail,
            organizationId,
            invitedById: adminId,
            roleId,
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

        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId: adminId,
          entityType: 'membership',
          entityId: membership.id,
          entityDisplayId: userEmail,
          entityLabel: 'Membership',
          action: 'MEMBER_ADDED' as ActivityAction,
          reason: `User ${userEmail} added to organization directly.`,
        });

        return { success: true, invited: false, joined: true };
      }

      // 2. Create/Update pending invitation
      const [invite] = await tx
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
        })
        .returning();

      if (!invite) throw new AppError('Failed to create invitation', 500);

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId: adminId,
        entityType: 'invite',
        entityId: invite.id,
        entityDisplayId: userEmail,
        entityLabel: 'Organization Invite',
        action: 'INVITE_SENT' as ActivityAction,
        reason: `Invitation sent to ${userEmail}.`,
      });

      return { success: true, invited: true, joined: false };
    });
  }

  /**
   * Resend a pending invitation.
   */
  async resendInvite(organizationId: string, adminId: string, inviteId: string) {
    return await db.transaction(async (tx) => {
      const invite = await tx.query.organizationInvites.findFirst({
        where: and(
          eq(organizationInvites.id, inviteId),
          eq(organizationInvites.organizationId, organizationId),
        ),
      });

      if (!invite) throw new AppError('Invitation not found', 404);

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

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId: adminId,
        entityType: 'invite',
        entityId: inviteId,
        entityDisplayId: invite.email,
        entityLabel: 'Organization Invite',
        action: 'INVITE_SENT' as ActivityAction,
        reason: `Invitation to ${invite.email} resent.`,
      });

      return { success: true };
    });
  }

  /**
   * Cancel a pending invitation.
   */
  async cancelInvite(organizationId: string, adminId: string, inviteId: string) {
    return await db.transaction(async (tx) => {
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

      if (!updated) throw new AppError('Invitation not found', 404);

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId: adminId,
        entityType: 'invite',
        entityId: inviteId,
        entityDisplayId: updated.email,
        entityLabel: 'Organization Invite',
        action: 'INVITE_REVOKED' as ActivityAction,
        reason: `Invitation to ${updated.email} revoked.`,
      });

      return { success: true };
    });
  }

  /**
   * Process pending invites for a user who just registered.
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
            userId,
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

        await ActivityLogger.record(tx as Transaction, {
          organizationId: invite.organizationId,
          userId,
          entityType: 'invite',
          entityId: invite.id,
          entityDisplayId: userEmail,
          entityLabel: 'Organization Invite',
          action: 'INVITE_ACCEPTED' as ActivityAction,
          reason: `User ${userEmail} joined organization via invite.`,
        });
      }

      return { processedCount: pendingInvites.length };
    });
  }
}

export const invitationsService = new InvitationsService();
