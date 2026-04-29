import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workComponents } from "./work-components";

export const workComponentDefects = pgTable("work_component_defects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  workComponentId: text("work_component_id")
    .notNull()
    .references(() => workComponents.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkComponentDefect = typeof workComponentDefects.$inferSelect;
export type NewWorkComponentDefect = typeof workComponentDefects.$inferInsert;
