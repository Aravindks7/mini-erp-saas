import { pgTable, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking, versioning } from './audit.schema.js';
import { user } from './auth.schema.js';
import { memberRoleEnum } from './auth-enums.schema.js';
import { organizations } from './organizations.schema.js';

/**
 * Multi-Tenancy Bridge: userId ↔ organizationId
 * Axiom: Users belong to 1..N organizations with distinct roles.
 */
export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: memberRoleEnum('role').notNull().default('employee'),

    ...timestamps,
    ...userTracking,
    ...versioning,
  },
  (t) => [
    uniqueIndex('org_member_unique_idx').on(t.userId, t.organizationId),
    index('org_member_org_idx').on(t.organizationId),
    index('org_member_user_idx').on(t.userId),
  ],
);

export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  user: one(user, {
    fields: [organizationMemberships.userId],
    references: [user.id],
  }),
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id],
  }),
}));

export type OrganizationMembership = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembership = typeof organizationMemberships.$inferInsert;
