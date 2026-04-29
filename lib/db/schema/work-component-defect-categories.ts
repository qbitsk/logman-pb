import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workComponents } from "./work-components";

export const workComponentDefectCategories = pgTable("work_component_defect_categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workComponentId: text("work_component_id")
    .notNull()
    .references(() => workComponents.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkComponentDefectCategory = typeof workComponentDefectCategories.$inferSelect;
export type NewWorkComponentDefectCategory = typeof workComponentDefectCategories.$inferInsert;
