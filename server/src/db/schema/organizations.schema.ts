import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { timestamps, userTracking } from './audit.schema.js';
import { organizationMemberships } from './memberships.schema.js';

// ---------------------------------------------------------------------------
// Organizations Table
// The root tenant entity — every piece of business data references this.
// ---------------------------------------------------------------------------

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  defaultCountry: text('default_country').notNull(),
  ...timestamps,
  ...userTracking,
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
}));

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
