import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productionProcesses } from "./production-processes";

export const productionProducts = pgTable("production_products", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  productionProcessId: text("production_process_id")
    .notNull()
    .references(() => productionProcesses.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionProduct = typeof productionProducts.$inferSelect;
export type NewProductionProduct = typeof productionProducts.$inferInsert;
