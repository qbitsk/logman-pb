import { pgTable, text, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { productionStations } from "./production-stations";
import { productionProducts } from "./production-products";

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

  productionProductId: text("production_product_id")
    .notNull()
    .references(() => productionProducts.id),
  productionStationId: text("production_station_id")
    .references(() => productionStations.id),
  units: integer("units"),
  shift: integer("shift"),
  notes: text("notes"),

  status: statusEnum("status").notNull().default("new"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WorkerProduction = typeof workerProductions.$inferSelect;
export type NewWorkerProduction = typeof workerProductions.$inferInsert;
