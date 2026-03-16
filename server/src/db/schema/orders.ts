import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { timestamps } from "./timestamps";
import { organizations } from "./organizations";

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  status: text("status").default("pending").notNull(),
...timestamps
});