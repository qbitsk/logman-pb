import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const workProducts = pgTable("work_products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkProduct = typeof workProducts.$inferSelect;
export type NewWorkProduct = typeof workProducts.$inferInsert;
