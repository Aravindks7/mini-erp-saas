import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core"
import { timestamps } from "./timestamps"

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ...timestamps
})