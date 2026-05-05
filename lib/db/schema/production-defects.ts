import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { productionComponents } from "./production-components";
import { productionProducts } from "./production-products";

export const productionDefectTypeEnum = pgEnum("production_defect_type", ["unit", "component"]);

export const productionDefects = pgTable("production_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: productionDefectTypeEnum("type").notNull(),
  productionProductId: text("production_product_id")
    .notNull()
    .references(() => productionProducts.id),
  productionComponentId: text("production_component_id")
    .references(() => productionComponents.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductionDefect = typeof productionDefects.$inferSelect;
export type NewProductionDefect = typeof productionDefects.$inferInsert;
