import { timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

export const userTracking = {
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
};

export const versioning = {
  version: integer('version').default(1).notNull(),
};

/**
 * Optimistic Locking Pattern:
 *
 * When updating an entity with 'versioning':
 * 1. Filter by ID and the CURRENT version.
 * 2. Increment the version in the SET clause.
 *
 * Example (Drizzle):
 * await db.update(table)
 *   .set({ ...data, version: sql`${table.version} + 1` })
 *   .where(and(eq(table.id, id), eq(table.version, currentVersion)));
 */

export const lifecycle = {
  deletedAt: timestamp('deleted_at'),
};
