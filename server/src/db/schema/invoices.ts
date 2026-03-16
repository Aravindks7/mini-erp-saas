import { pgTable, uuid, timestamp, numeric, text } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { orders } from "./orders";
import { timestamps } from "./timestamps";

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  amountDue: numeric("amount_due", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("unpaid").notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
    ...timestamps
});
