import { pgTable, uuid, text, numeric } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { organizations } from "./organizations";

export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  ...timestamps
});