import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { submissions } from "./submissions";
import { workComponents } from "./work-components";
import { workComponentDefectCategories } from "./work-component-defect-categories";

export const workComponentDefects = pgTable("work_component_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  workComponentId: text("work_component_id")
    .notNull()
    .references(() => workComponents.id),
  workComponentDefectCategoryId: text("work_component_defect_category_id")
    .notNull()
    .references(() => workComponentDefectCategories.id),
  units: integer("units").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkComponentDefect = typeof workComponentDefects.$inferSelect;
export type NewWorkComponentDefect = typeof workComponentDefects.$inferInsert;
