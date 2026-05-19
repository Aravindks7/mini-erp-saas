import { pgTable, text, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { permissionSets } from './permission-sets.schema.js';
import { permissions } from './permissions.schema.js';

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
