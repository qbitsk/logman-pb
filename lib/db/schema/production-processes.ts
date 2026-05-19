import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const productionProcesses = pgTable("production_processes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionProcess = typeof productionProcesses.$inferSelect;
export type NewProductionProcess = typeof productionProcesses.$inferInsert;
