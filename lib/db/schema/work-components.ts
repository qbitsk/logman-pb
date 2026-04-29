import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workCategories } from "./work-categories";

export const workComponents = pgTable("work_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workCategoryId: text("work_category_id")
    .notNull()
    .references(() => workCategories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkComponent = typeof workComponents.$inferSelect;
export type NewWorkComponent = typeof workComponents.$inferInsert;
