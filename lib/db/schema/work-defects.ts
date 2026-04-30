import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { submissions } from "./submissions";
import { workComponents } from "./work-components";
import { categories } from "./categories";

export const workDefectTypeEnum = pgEnum("work_defect_type", ["component", "unit"]);

export const workDefects = pgTable("work_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  type: workDefectTypeEnum("type").notNull(),
  workComponentId: text("work_component_id")
    .references(() => workComponents.id),
  categoryId: text("category_id")
    .references(() => categories.id),
  units: integer("units").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkDefect = typeof workDefects.$inferSelect;
export type NewWorkDefect = typeof workDefects.$inferInsert;
