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

export const lifecycle = {
  deletedAt: timestamp('deleted_at'),
};
