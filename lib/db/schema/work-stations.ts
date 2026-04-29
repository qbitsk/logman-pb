import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workCategories } from "./work-categories";

export const workStations = pgTable("work_stations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workCategoryId: text("work_category_id")
    .notNull()
    .references(() => workCategories.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkStation = typeof workStations.$inferSelect;
export type NewWorkStation = typeof workStations.$inferInsert;
