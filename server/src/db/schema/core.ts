import { pgTable, text, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './base.schema';
import { organizationMemberships } from './auth';

// ---------------------------------------------------------------------------
// Organizations Table
// The root tenant entity — every piece of business data references this.
// ---------------------------------------------------------------------------

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  ...timestamps,
  ...userTracking,
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

// ---------------------------------------------------------------------------
// Base columns injected into every business table for multi-tenancy.
// Every table that stores tenant-specific data must spread `baseColumns`.
// ---------------------------------------------------------------------------

export const baseColumns = {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
};

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
