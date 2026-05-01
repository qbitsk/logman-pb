import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { workerProductions } from "./worker-productions";
import { workDefects } from "./work-defects";

export const workerProductionDefects = pgTable("worker_production_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  workerProductionId: text("worker_production_id")
    .notNull()
    .references(() => workerProductions.id, { onDelete: "cascade" }),
  workDefectId: text("work_defect_id")
    .notNull()
    .references(() => workDefects.id),
  units: integer("units").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkerProductionDefect = typeof workerProductionDefects.$inferSelect;
export type NewWorkerProductionDefect = typeof workerProductionDefects.$inferInsert;
