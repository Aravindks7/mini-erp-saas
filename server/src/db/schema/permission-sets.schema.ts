import { pgTable, text, uuid, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { organizations } from './organizations.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { permissionSetItems } from './permission-set-items.schema.js';

/**
 * Permission Sets: Logical groups of permissions
 */
export const permissionSets = pgTable(
  'permission_sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    organizationId: uuid('organization_id').references(() => organizations.id, {
      onDelete: 'cascade',
    }), // NULL for global sets
    isBaseSet: boolean('is_base_set').notNull().default(false),
    ...timestamps,
    ...userTracking,
  },
  (t) => [
    // Rule 1: Global sets must have unique names
    uniqueIndex('perm_set_global_name_idx')
      .on(t.name)
      .where(sql`${t.organizationId} IS NULL`),
    // Rule 2: Tenant-specific sets must have unique names
    uniqueIndex('perm_set_tenant_name_idx')
      .on(t.name, t.organizationId)
      .where(sql`${t.organizationId} IS NOT NULL`),
  ],
);

export const permissionSetsRelations = relations(permissionSets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [permissionSets.organizationId],
    references: [organizations.id],
  }),
  items: many(permissionSetItems),
}));
