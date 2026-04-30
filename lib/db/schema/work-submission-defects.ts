import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { submissions } from "./submissions";
import { workDefects } from "./work-defects";

export const workSubmissionDefects = pgTable("work_submission_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  submissionId: text("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  workDefectId: text("work_defect_id")
    .notNull()
    .references(() => workDefects.id),
  units: integer("units").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkSubmissionDefect = typeof workSubmissionDefects.$inferSelect;
export type NewWorkSubmissionDefect = typeof workSubmissionDefects.$inferInsert;
