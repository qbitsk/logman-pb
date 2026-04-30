import { pgTable, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { categories } from "./categories";
import { workStations } from "./work-stations";

export const statusEnum = pgEnum("submission_status", [
  "draft",
  "submitted",
  "approved",
  "rejected",
]);

export const submissions = pgTable("submissions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  workCategoryId: text("work_category_id")
    .notNull()
    .references(() => categories.id),
  workStationId: text("work_station_id")
    .references(() => workStations.id),
  units: integer("units"),
  shift: integer("shift"),
  notes: text("notes"),

  status: statusEnum("status").notNull().default("draft"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
