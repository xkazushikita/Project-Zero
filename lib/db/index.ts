import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

let cached: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Returns null with no DATABASE_URL set — callers must handle that
// (graceful degradation: the app boots and runs with no database).
export function getDb() {
  if (!isDbConfigured()) return null;
  if (!cached) {
    const sql = neon(process.env.DATABASE_URL as string);
    cached = drizzle(sql, { schema });
  }
  return cached;
}
