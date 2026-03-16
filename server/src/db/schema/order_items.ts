import { pgTable, uuid, integer, numeric } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";
import { timestamps } from "./timestamps";

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  productId: uuid("product_id")
    .references(() => products.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    ...timestamps
});