import { sql } from './src/db/neonClient.js';

async function alter() {
  try {
    await sql`ALTER TABLE game_requests ADD COLUMN IF NOT EXISTS link TEXT;`;
    await sql`ALTER TABLE game_requests ADD COLUMN IF NOT EXISTS engine TEXT;`;
    console.log("Database altered successfully");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

alter();
