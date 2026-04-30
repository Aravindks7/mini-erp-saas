import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { roles } from './roles.schema.js';
import { permissionSets } from './permission-sets.schema.js';

/**
 * Role Permission Sets: Link roles to permission groups
 */
export const rolePermissionSets = pgTable(
  'role_permission_sets',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionSetId: uuid('permission_set_id')
      .notNull()
      .references(() => permissionSets.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionSetId] })],
);

export const rolePermissionSetsRelations = relations(rolePermissionSets, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissionSets.roleId],
    references: [roles.id],
  }),
  permissionSet: one(permissionSets, {
    fields: [rolePermissionSets.permissionSetId],
    references: [permissionSets.id],
  }),
}));
