import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { productionProducts } from "./production-products";

export const productionComponents = pgTable("production_components", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  productionProductId: text("production_product_id")
    .notNull()
    .references(() => productionProducts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionComponent = typeof productionComponents.$inferSelect;
export type NewProductionComponent = typeof productionComponents.$inferInsert;
