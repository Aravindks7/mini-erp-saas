import { pgTable, uuid, text, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { organizations } from './organizations.schema.js';
import { user } from './auth.schema.js';

/**
 * Activity Logs: The append-only audit trail and UI lifecycle feed.
 * Axiom: Every significant domain event must be captured for auditability and the "Temporal Narrative".
 */
export const activityLogs = pgTable(
  'activity_logs',
  {
    ...baseColumns,
    entityType: text('entity_type').notNull(), // e.g., 'sales_order', 'invoice'
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(), // e.g., 'ORDER_CREATED', 'STATUS_CHANGED'
    reason: text('reason'), // Human-readable context for the change
    snapshot: jsonb('snapshot'), // Data snapshot at the time of activity
    ...timestamps,
    ...userTracking,
  },
  (table) => [
    index('activity_logs_org_idx').on(table.organizationId),
    index('activity_logs_entity_idx').on(table.entityType, table.entityId),
    index('activity_logs_timeline_idx').on(table.organizationId, table.entityType, table.entityId),
  ],
);

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLogs.organizationId],
    references: [organizations.id],
  }),
  user: one(user, {
    fields: [activityLogs.createdBy],
    references: [user.id],
  }),
}));

export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
