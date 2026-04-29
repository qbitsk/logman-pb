import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const workCategoryTypeEnum = pgEnum("work_category_type", [
  "assembly",
  "other",
]);

export const workCategories = pgTable("work_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: workCategoryTypeEnum("type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkCategory = typeof workCategories.$inferSelect;
export type NewWorkCategory = typeof workCategories.$inferInsert;
