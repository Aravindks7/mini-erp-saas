import { pgTable, uuid, timestamp, numeric, text } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { timestamps } from "./timestamps";
import { organizations } from "./organizations";

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  invoiceId: uuid("invoice_id")
    .references(() => invoices.id)
    .notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method"),
  status: text("status").default("completed").notNull(),
  paidAt: timestamp("paid_at").defaultNow().notNull(),
  ...timestamps
});