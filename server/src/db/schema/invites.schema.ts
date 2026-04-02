import { pgTable, uuid, text, index, timestamp as pgTimestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking, versioning } from './audit.schema.js';
import { user } from './auth.schema.js';
import { memberRoleEnum, inviteStatusEnum } from './auth-enums.schema.js';
import { organizations } from './organizations.schema.js';

/**
 * Organization Invites: Multi-tenant invitation management.
 * Tracks non-existent users before they convert to full members.
 */
export const organizationInvites = pgTable(
  'organization_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    invitedById: uuid('invited_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('employee'),
    status: inviteStatusEnum('status').notNull().default('pending'),
    expiresAt: pgTimestamp('expires_at').notNull(),

    ...timestamps,
    ...userTracking,
    ...versioning,
  },
  (t) => [
    index('org_invite_email_idx').on(t.email),
    index('org_invite_org_idx').on(t.organizationId),
  ],
);

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
  invitedBy: one(user, {
    fields: [organizationInvites.invitedById],
    references: [user.id],
  }),
}));

export type OrganizationInvite = typeof organizationInvites.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvites.$inferInsert;
