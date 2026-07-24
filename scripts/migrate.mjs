import { config } from "dotenv";
config({ path: ".env.local" });

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("No DATABASE_URL set — skipping migrations (the app still runs fine without one).");
  process.exit(0);
}

const migrationsDir = fileURLToPath(new URL("../lib/db/migrations/", import.meta.url));
const pool = new Pool({ connectionString: databaseUrl });

async function run() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`
  );
  const { rows } = await pool.query("SELECT name FROM _migrations");
  const applied = new Set(rows.map((r) => r.name));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;
    ranAny = true;
    console.log("Applying " + file + " ...");
    const sqlText = readFileSync(migrationsDir + file, "utf8");
    await pool.query(sqlText);
    await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
    console.log("Applied " + file);
  }

  console.log(ranAny ? "All migrations applied." : "Already up to date — nothing to do.");
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
