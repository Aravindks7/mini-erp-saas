import { pgTable, text, uuid, primaryKey, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { organizations } from './organizations.schema.js';
import { timestamps, userTracking } from './audit.schema.js';

/**
 * Static Permissions (Seeded from code)
 */
export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(), // e.g., 'customers:read'
  description: text('description'),
});

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

/**
 * Permission Set Items: Link sets to granular permissions
 */
export const permissionSetItems = pgTable(
  'permission_set_items',
  {
    permissionSetId: uuid('permission_set_id')
      .notNull()
      .references(() => permissionSets.id, { onDelete: 'cascade' }),
    permissionId: text('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.permissionSetId, t.permissionId] })],
);

export const permissionSetsRelations = relations(permissionSets, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [permissionSets.organizationId],
    references: [organizations.id],
  }),
  items: many(permissionSetItems),
}));

export const permissionSetItemsRelations = relations(permissionSetItems, ({ one }) => ({
  set: one(permissionSets, {
    fields: [permissionSetItems.permissionSetId],
    references: [permissionSets.id],
  }),
  permission: one(permissions, {
    fields: [permissionSetItems.permissionId],
    references: [permissions.id],
  }),
}));
