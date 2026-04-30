import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const workDefectTypeEnum = pgEnum("work_defect_type", ["unit", "component"]);

export const workDefects = pgTable("work_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: workDefectTypeEnum("type").notNull(),
  workCategoryId: text("work_category_id")
    .notNull()
    .references(() => categories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkDefect = typeof workDefects.$inferSelect;
export type NewWorkDefect = typeof workDefects.$inferInsert;
