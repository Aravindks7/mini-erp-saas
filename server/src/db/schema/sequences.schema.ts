import { pgTable, text, uuid, integer, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { baseColumns } from './base.schema.js';
import { timestamps, userTracking } from './audit.schema.js';
import { organizations } from './organizations.schema.js';

/**
 * Document Sequencing System
 * Ensures human-readable, organization-scoped sequential identifiers (e.g., SO-001).
 * Demonstrated Pattern: Atomic counters in a multi-tenant environment.
 */
export const documentSequences = pgTable(
  'document_sequences',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    type: text('type').notNull(), // e.g., 'SO', 'PO', 'INV'
    prefix: text('prefix').notNull(), // e.g., 'SO-'
    nextValue: integer('next_value').default(1).notNull(),
    padding: integer('padding').default(4).notNull(), // e.g., 4 => 0001
  },
  (table) => [uniqueIndex('doc_seq_org_type_unique').on(table.organizationId, table.type)],
);

export const documentSequencesRelations = relations(documentSequences, ({ one }) => ({
  organization: one(organizations, {
    fields: [documentSequences.organizationId],
    references: [organizations.id],
  }),
}));

export type DocumentSequence = typeof documentSequences.$inferSelect;
export type NewDocumentSequence = typeof documentSequences.$inferInsert;
