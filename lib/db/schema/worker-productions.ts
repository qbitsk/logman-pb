import { pgTable, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { workStations } from "./work-stations";
import { workProducts } from "./work-products";

export const statusEnum = pgEnum("worker_production_status", [
  "new",
  "approved",
  "rejected",
]);

export const workerProductions = pgTable("worker_productions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  workProductId: text("work_product_id")
    .notNull()
    .references(() => workProducts.id),
  workStationId: text("work_station_id")
    .references(() => workStations.id),
  units: integer("units"),
  shift: integer("shift"),
  notes: text("notes"),

  status: statusEnum("status").notNull().default("new"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkerProduction = typeof workerProductions.$inferSelect;
export type NewWorkerProduction = typeof workerProductions.$inferInsert;
