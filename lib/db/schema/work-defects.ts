import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { workComponents } from "./work-components";
import { workProducts } from "./work-products";

export const workDefectTypeEnum = pgEnum("work_defect_type", ["unit", "component"]);

export const workDefects = pgTable("work_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: workDefectTypeEnum("type").notNull(),
  workProductId: text("work_product_id")
    .notNull()
    .references(() => workProducts.id),
  workComponentId: text("work_component_id")
    .references(() => workComponents.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkDefect = typeof workDefects.$inferSelect;
export type NewWorkDefect = typeof workDefects.$inferInsert;
