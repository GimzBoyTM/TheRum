import { sql } from './neonClient.js';

/**
 * Database initialization script.
 * Creates all tables and seeds default data.
 * Run with: npx tsx src/db/dbInit.ts
 */
async function initDatabase() {
  console.log('🔄 Initializing database schema...');

  // ── 1. Users ──
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      google_email TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar_url TEXT
    )
  `;
  console.log('  ✅ Table "users" ready');

  // ── 2. Games ──
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT NOT NULL,
      description TEXT NOT NULL,
      cover_url TEXT,
      banner_url TEXT,
      creator TEXT,
      developer TEXT,
      publisher TEXT,
      status TEXT NOT NULL,
      engine TEXT NOT NULL,
      platforms TEXT[] DEFAULT '{Windows}',
      age_rating TEXT DEFAULT '16+',
      views_count INTEGER DEFAULT 0,
      downloads_count INTEGER DEFAULT 0,
      bookmarks_count INTEGER DEFAULT 0,
      tags TEXT[] DEFAULT '{}',
      download_links JSONB DEFAULT '[]',
      changelogs JSONB DEFAULT '[]',
      screenshots TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      uploader_id TEXT,
      uploader_name TEXT
    )
  `;
  console.log('  ✅ Table "games" ready');

  // ── 3. Bookmarks ──
  await sql`
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, game_id)
    )
  `;
  console.log('  ✅ Table "bookmarks" ready');

  // ── 4. Broken Reports ──
  await sql`
    CREATE TABLE IF NOT EXISTS broken_reports (
      id TEXT PRIMARY KEY,
      game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      game_title TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Table "broken_reports" ready');

  // ── 5. Tags ──
  await sql`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL
    )
  `;
  console.log('  ✅ Table "tags" ready');

  // ── 6. Game Requests ──
  await sql`
    CREATE TABLE IF NOT EXISTS game_requests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      original_name TEXT,
      link TEXT,
      engine TEXT,
      description TEXT,
      platforms TEXT[] DEFAULT '{Windows}',
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      votes TEXT[] DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'Chờ duyệt',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('  ✅ Table "game_requests" ready');

  // ── 7. Filter Config ──
  await sql`
    CREATE TABLE IF NOT EXISTS filter_config (
      id INTEGER PRIMARY KEY DEFAULT 1,
      genres TEXT[] DEFAULT '{}',
      engines TEXT[] DEFAULT '{}',
      platforms TEXT[] DEFAULT '{}'
    )
  `;
  console.log('  ✅ Table "filter_config" ready');

  // ═══════════════════════════ SEED DATA ═══════════════════════════

  console.log('\n🌱 Seeding default data...');

  // Seed admin user (upsert)
  await sql`
    INSERT INTO users (id, username, email, password, role, avatar_url)
    VALUES (
      'admin-therum',
      'therum',
      'therum@admin.com',
      'admin',
      'admin',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80'
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('  ✅ Admin user seeded');

  // Seed default tags (upsert)
  const defaultTags = [
    { id: 't1', name: 'Romance', slug: 'romance', type: 'genre' },
    { id: 't2', name: 'Drama', slug: 'drama', type: 'genre' },
    { id: 't3', name: 'Slice of Life', slug: 'slice-of-life', type: 'genre' },
    { id: 't4', name: 'Action', slug: 'action', type: 'genre' },
    { id: 't5', name: 'Fantasy', slug: 'fantasy', type: 'genre' },
    { id: 't6', name: 'Mystery', slug: 'mystery', type: 'genre' },
    { id: 't7', name: 'Sci-Fi', slug: 'sci-fi', type: 'genre' },
    { id: 't8', name: 'Psychological', slug: 'psychological', type: 'genre' },
    { id: 't9', name: 'Thriller', slug: 'thriller', type: 'genre' },
    { id: 't10', name: 'Gothic', slug: 'gothic', type: 'genre' },
    { id: 't11', name: 'Tragedy', slug: 'tragedy', type: 'genre' },
    { id: 't12', name: 'Horror', slug: 'horror', type: 'genre' },
    { id: 't13', name: 'School Life', slug: 'school-life', type: 'genre' },
    { id: 't14', name: 'Chương Trình Việt Hóa', slug: 'chuong-trinh-viet-hoa', type: 'status' },
    { id: 't15', name: 'Đặc Sắc', slug: 'dac-sac', type: 'feature' },
    { id: 't16', name: 'Hoàn Thành', slug: 'hoan-thanh', type: 'status' },
  ];

  for (const tag of defaultTags) {
    await sql`
      INSERT INTO tags (id, name, slug, type)
      VALUES (${tag.id}, ${tag.name}, ${tag.slug}, ${tag.type})
      ON CONFLICT (id) DO NOTHING
    `;
  }
  console.log('  ✅ Default tags seeded (' + defaultTags.length + ' tags)');

  // Seed default filter config
  await sql`
    INSERT INTO filter_config (id, genres, engines, platforms)
    VALUES (
      1,
      ${'{"Romance","Drama","Slice of Life","Action","Fantasy","Mystery","Sci-Fi","Psychological","Thriller","Gothic","Tragedy","Horror","School Life"}'},
      ${'{"RenPy","KiriKiri","Unity","RPG Maker","TyranoBuilder"}'},
      ${'{"Windows","Android","macOS","iOS","WebHTML5"}'}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log('  ✅ Default filter config seeded');

  console.log('\n🎉 Database initialization complete!');
}

initDatabase().catch(err => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
