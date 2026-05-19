import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productionProcesses } from "./production-processes";

export const productionParts = pgTable("production_parts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  productionProcessId: text("production_process_id")
    .notNull()
    .references(() => productionProcesses.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionPart = typeof productionParts.$inferSelect;
export type NewProductionPart = typeof productionParts.$inferInsert;
