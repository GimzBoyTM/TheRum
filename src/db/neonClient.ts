import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load .env.local for local development
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
}

export const sql = neon(databaseUrl);
