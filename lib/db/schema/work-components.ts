import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workProducts } from "./work-products";

export const workComponents = pgTable("work_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workProductId: text("work_product_id")
    .notNull()
    .references(() => workProducts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkComponent = typeof workComponents.$inferSelect;
export type NewWorkComponent = typeof workComponents.$inferInsert;
