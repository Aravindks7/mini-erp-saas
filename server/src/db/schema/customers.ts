import { pgTable, uuid, text } from "drizzle-orm/pg-core"
import { timestamps } from "./timestamps"
import { organizations } from "./organizations"

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  ...timestamps
})