import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Use the pooled connection string at runtime (not the direct one)
const connectionString = process.env.DATABASE_URL!;

// Prevent multiple instances in development (Next.js hot reload)
const globalForDb = globalThis as unknown as {
  connection: postgres.Sql | undefined;
};

const connection =
  globalForDb.connection ??
  postgres(connectionString, {
    prepare: false, // Required for Supabase transaction mode pooler
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.connection = connection;
}

export const db = drizzle(connection, { schema });
