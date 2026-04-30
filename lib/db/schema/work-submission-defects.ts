import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { submissions } from "./submissions";
import { workComponents } from "./work-components";
import { categories } from "./categories";

export const workSubmissionDefectTypeEnum = pgEnum("work_submission_defect_type", ["component", "unit"]);

export const workSubmissionDefects = pgTable("work_submission_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  type: workSubmissionDefectTypeEnum("type").notNull(),
  workComponentId: text("work_component_id")
    .references(() => workComponents.id),
  categoryId: text("category_id")
    .references(() => categories.id),
  units: integer("units").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkSubmissionDefect = typeof workSubmissionDefects.$inferSelect;
export type NewWorkSubmissionDefect = typeof workSubmissionDefects.$inferInsert;
