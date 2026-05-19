import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productionParts } from "./production-parts";

export const productionComponents = pgTable("production_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  productionPartId: text("production_part_id")
    .notNull()
    .references(() => productionParts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionComponent = typeof productionComponents.$inferSelect;
export type NewProductionComponent = typeof productionComponents.$inferInsert;
