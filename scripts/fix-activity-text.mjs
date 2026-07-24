// One-off cleanup: older activity log rows had the agent's name baked directly
// into the text ("Brand Scout prepared a strategy for X"), so renaming an agent
// later couldn't update history that already mentioned the old name. This strips
// that leading name back out, matching how new entries are written going forward.
import { config } from "dotenv";
config({ path: ".env.local" });

import { Pool } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("No DATABASE_URL set — nothing to fix.");
  process.exit(0);
}

const pool = new Pool({ connectionString: databaseUrl });

async function run() {
  const { rows } = await pool.query(
    `SELECT id, text FROM activity WHERE text ~ '^.+ prepared a strategy for '`
  );
  console.log("Found " + rows.length + " row(s) with a stale name baked in.");
  for (const row of rows) {
    const fixed = row.text.replace(/^.+ prepared a strategy for /, "Prepared a strategy for ");
    await pool.query("UPDATE activity SET text = $1 WHERE id = $2", [fixed, row.id]);
    console.log("  " + row.text + "  ->  " + fixed);
  }
  console.log("Done.");
  await pool.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
