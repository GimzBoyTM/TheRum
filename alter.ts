import { sql } from './src/db/neonClient.js';

async function alterDatabase() {
  try {
    console.log('Adding google_email column to users table...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email TEXT;`;
    console.log('Column added successfully.');
  } catch (err) {
    console.error('Error altering table:', err);
  } finally {
    process.exit(0);
  }
}

alterDatabase();
