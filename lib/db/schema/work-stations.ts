import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workProducts } from "./work-products";

export const workStations = pgTable("work_stations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workProductId: text("work_product_id")
    .notNull()
    .references(() => workProducts.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkStation = typeof workStations.$inferSelect;
export type NewWorkStation = typeof workStations.$inferInsert;
