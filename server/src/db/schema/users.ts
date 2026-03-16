import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { timestamps } from "./timestamps";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("member").notNull(),
  ...timestamps
});