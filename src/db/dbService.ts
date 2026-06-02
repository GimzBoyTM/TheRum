import { sql } from './neonClient.js';
import { Game, User, Bookmark, BrokenReport, Tag, GameRequest } from '../types.js';

// ═══════════════════════════════════════════════════════════════════
// Helper: Convert snake_case DB rows ↔ camelCase TypeScript objects
// ═══════════════════════════════════════════════════════════════════

function rowToUser(r: any): User {
  return {
    id: r.id,
    username: r.username,
    email: r.email,
    googleEmail: r.google_email,
    password: r.password,
    role: r.role,
    avatarUrl: r.avatar_url,
  };
}

function rowToGame(r: any): Game {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    shortDescription: r.short_description,
    description: r.description,
    coverUrl: r.cover_url,
    bannerUrl: r.banner_url,
    creator: r.creator,
    developer: r.developer,
    publisher: r.publisher,
    status: r.status,
    engine: r.engine,
    platforms: r.platforms || [],
    ageRating: r.age_rating,
    viewsCount: r.views_count ?? 0,
    downloadsCount: r.downloads_count ?? 0,
    bookmarksCount: r.bookmarks_count ?? 0,
    tags: r.tags || [],
    downloadLinks: typeof r.download_links === 'string' ? JSON.parse(r.download_links) : (r.download_links || []),
    changelogs: typeof r.changelogs === 'string' ? JSON.parse(r.changelogs) : (r.changelogs || []),
    screenshots: r.screenshots || [],
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : r.updated_at,
    uploaderId: r.uploader_id,
    uploaderName: r.uploader_name,
  };
}

function rowToBookmark(r: any): Bookmark {
  return {
    userId: r.user_id,
    gameId: r.game_id,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

function rowToReport(r: any): BrokenReport {
  return {
    id: r.id,
    gameId: r.game_id,
    gameTitle: r.game_title,
    userId: r.user_id,
    username: r.username,
    message: r.message,
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

function rowToTag(r: any): Tag {
  return { id: r.id, name: r.name, slug: r.slug, type: r.type };
}

function rowToGameRequest(r: any): GameRequest {
  return {
    id: r.id,
    title: r.title,
    originalName: r.original_name,
    link: r.link,
    engine: r.engine,
    description: r.description,
    platforms: r.platforms || [],
    userId: r.user_id,
    username: r.username,
    votes: r.votes || [],
    status: r.status,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Database Service — async methods using Neon SQL
// ═══════════════════════════════════════════════════════════════════

export const db = {
  // ──────────── Full Data (for backup/restore) ────────────

  getData: async () => {
    const [users, games, bookmarks, brokenReports, tags, gameRequests] = await Promise.all([
      db.getUsers(),
      db.getGames(),
      db.getBookmarks(),
      db.getBrokenReports(),
      db.getTags(),
      db.getGameRequests(),
    ]);
    return { users, games, bookmarks, brokenReports, tags, gameRequests };
  },

  saveData: async (data: any) => {
    // Full restore: truncate all tables and re-insert
    // Order matters due to foreign key constraints
    await sql`TRUNCATE bookmarks, broken_reports, game_requests, games, tags, users CASCADE`;

    // Restore users
    if (Array.isArray(data.users)) {
      for (const u of data.users) {
        await sql`
          INSERT INTO users (id, username, email, google_email, password, role, avatar_url)
          VALUES (${u.id}, ${u.username}, ${u.email}, ${u.googleEmail || u.google_email || null}, ${u.password || ''}, ${u.role || 'user'}, ${u.avatarUrl || u.avatar_url || null})
        `;
      }
    }

    // Restore games
    if (Array.isArray(data.games)) {
      for (const g of data.games) {
        await sql`
          INSERT INTO games (id, title, slug, short_description, description, cover_url, banner_url,
            creator, developer, publisher, status, engine, platforms, age_rating,
            views_count, downloads_count, bookmarks_count, tags, download_links, changelogs,
            screenshots, created_at, updated_at, uploader_id, uploader_name)
          VALUES (
            ${g.id}, ${g.title}, ${g.slug}, ${g.shortDescription || g.short_description},
            ${g.description}, ${g.coverUrl || g.cover_url || null}, ${g.bannerUrl || g.banner_url || null},
            ${g.creator || null}, ${g.developer || null}, ${g.publisher || null},
            ${g.status}, ${g.engine}, ${g.platforms || ['Windows']}, ${g.ageRating || g.age_rating || '16+'},
            ${g.viewsCount ?? g.views_count ?? 0}, ${g.downloadsCount ?? g.downloads_count ?? 0},
            ${g.bookmarksCount ?? g.bookmarks_count ?? 0}, ${g.tags || []},
            ${JSON.stringify(g.downloadLinks || g.download_links || [])},
            ${JSON.stringify(g.changelogs || [])},
            ${g.screenshots || []},
            ${g.createdAt || g.created_at || new Date().toISOString()},
            ${g.updatedAt || g.updated_at || new Date().toISOString()},
            ${g.uploaderId || g.uploader_id || null}, ${g.uploaderName || g.uploader_name || null}
          )
        `;
      }
    }

    // Restore tags
    if (Array.isArray(data.tags)) {
      for (const t of data.tags) {
        await sql`
          INSERT INTO tags (id, name, slug, type)
          VALUES (${t.id}, ${t.name}, ${t.slug}, ${t.type})
        `;
      }
    }

    // Restore bookmarks
    if (Array.isArray(data.bookmarks)) {
      for (const b of data.bookmarks) {
        await sql`
          INSERT INTO bookmarks (user_id, game_id, created_at)
          VALUES (${b.userId || b.user_id}, ${b.gameId || b.game_id}, ${b.createdAt || b.created_at || new Date().toISOString()})
        `;
      }
    }

    // Restore broken reports
    if (Array.isArray(data.brokenReports)) {
      for (const r of data.brokenReports) {
        await sql`
          INSERT INTO broken_reports (id, game_id, game_title, user_id, username, message, status, created_at)
          VALUES (${r.id}, ${r.gameId || r.game_id}, ${r.gameTitle || r.game_title}, ${r.userId || r.user_id},
            ${r.username}, ${r.message}, ${r.status || 'pending'}, ${r.createdAt || r.created_at || new Date().toISOString()})
        `;
      }
    }

    // Restore game requests
    if (Array.isArray(data.gameRequests)) {
      for (const gr of data.gameRequests) {
        await sql`
          INSERT INTO game_requests (id, title, original_name, link, engine, description, platforms, user_id, username, votes, status, created_at)
          VALUES (${gr.id}, ${gr.title}, ${gr.originalName || gr.original_name || ''}, ${gr.link || ''}, ${gr.engine || ''},
            ${gr.description || ''}, ${gr.platforms || ['Windows']}, ${gr.userId || gr.user_id},
            ${gr.username}, ${gr.votes || []}, ${gr.status || 'Chờ duyệt'},
            ${gr.createdAt || gr.created_at || new Date().toISOString()})
        `;
      }
    }
  },

  // ──────────── Users ────────────

  getUsers: async (): Promise<User[]> => {
    const rows = await sql`SELECT * FROM users`;
    return rows.map(rowToUser);
  },

  saveUsers: async (users: User[]) => {
    await sql`TRUNCATE users CASCADE`;
    for (const u of users) {
      await sql`
        INSERT INTO users (id, username, email, google_email, password, role, avatar_url)
        VALUES (${u.id}, ${u.username}, ${u.email}, ${u.googleEmail || null}, ${u.password || ''}, ${u.role}, ${u.avatarUrl || null})
      `;
    }
  },

  addUser: async (user: User) => {
    await sql`
      INSERT INTO users (id, username, email, google_email, password, role, avatar_url)
      VALUES (${user.id}, ${user.username}, ${user.email}, ${user.googleEmail || null}, ${user.password || ''}, ${user.role}, ${user.avatarUrl || null})
    `;
  },

  updateUserRole: async (id: string, role: string) => {
    await sql`UPDATE users SET role = ${role} WHERE id = ${id}`;
  },

  updateUserGoogleEmail: async (id: string, googleEmail: string) => {
    await sql`UPDATE users SET google_email = ${googleEmail} WHERE id = ${id}`;
  },

  deleteUser: async (id: string) => {
    await sql`DELETE FROM users WHERE id = ${id}`;
  },

  updateUserPassword: async (id: string, newPassword: string) => {
    await sql`UPDATE users SET password = ${newPassword} WHERE id = ${id}`;
  },

  getUserById: async (id: string): Promise<User | null> => {
    const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  },

  findUserByLogin: async (usernameOrEmail: string, password: string): Promise<User | null> => {
    const rows = await sql`
      SELECT * FROM users
      WHERE (LOWER(username) = LOWER(${usernameOrEmail}) OR LOWER(email) = LOWER(${usernameOrEmail}))
        AND password = ${password}
    `;
    return rows.length > 0 ? rowToUser(rows[0]) : null;
  },

  checkUsernameExists: async (username: string): Promise<boolean> => {
    const rows = await sql`SELECT 1 FROM users WHERE LOWER(username) = LOWER(${username})`;
    return rows.length > 0;
  },

  checkEmailExists: async (email: string): Promise<boolean> => {
    const rows = await sql`SELECT 1 FROM users WHERE LOWER(email) = LOWER(${email})`;
    return rows.length > 0;
  },

  // ──────────── Games ────────────

  getGames: async (): Promise<Game[]> => {
    const rows = await sql`SELECT * FROM games`;
    return rows.map(rowToGame);
  },

  getGameBySlug: async (slug: string): Promise<Game | null> => {
    const rows = await sql`SELECT * FROM games WHERE slug = ${slug}`;
    return rows.length > 0 ? rowToGame(rows[0]) : null;
  },

  getGameById: async (id: string): Promise<Game | null> => {
    const rows = await sql`SELECT * FROM games WHERE id = ${id}`;
    return rows.length > 0 ? rowToGame(rows[0]) : null;
  },

  saveGames: async (games: Game[]) => {
    await sql`TRUNCATE games CASCADE`;
    for (const g of games) {
      await db.addGame(g);
    }
  },

  addGame: async (game: Game) => {
    await sql`
      INSERT INTO games (id, title, slug, short_description, description, cover_url, banner_url,
        creator, developer, publisher, status, engine, platforms, age_rating,
        views_count, downloads_count, bookmarks_count, tags, download_links, changelogs,
        screenshots, created_at, updated_at, uploader_id, uploader_name)
      VALUES (
        ${game.id}, ${game.title}, ${game.slug}, ${game.shortDescription},
        ${game.description}, ${game.coverUrl || null}, ${game.bannerUrl || null},
        ${game.creator || null}, ${game.developer || null}, ${game.publisher || null},
        ${game.status}, ${game.engine}, ${game.platforms || ['Windows']}, ${game.ageRating || '16+'},
        ${game.viewsCount ?? 0}, ${game.downloadsCount ?? 0}, ${game.bookmarksCount ?? 0},
        ${game.tags || []}, ${JSON.stringify(game.downloadLinks || [])},
        ${JSON.stringify(game.changelogs || [])}, ${game.screenshots || []},
        ${game.createdAt || new Date().toISOString()}, ${game.updatedAt || new Date().toISOString()},
        ${game.uploaderId || null}, ${game.uploaderName || null}
      )
    `;
  },

  updateGame: async (game: Game) => {
    await sql`
      UPDATE games SET
        title = ${game.title},
        short_description = ${game.shortDescription},
        description = ${game.description},
        cover_url = ${game.coverUrl || null},
        banner_url = ${game.bannerUrl || null},
        developer = ${game.developer || null},
        publisher = ${game.publisher || null},
        status = ${game.status},
        engine = ${game.engine},
        platforms = ${game.platforms || ['Windows']},
        age_rating = ${game.ageRating || '16+'},
        views_count = ${game.viewsCount ?? 0},
        downloads_count = ${game.downloadsCount ?? 0},
        bookmarks_count = ${game.bookmarksCount ?? 0},
        tags = ${game.tags || []},
        download_links = ${JSON.stringify(game.downloadLinks || [])},
        changelogs = ${JSON.stringify(game.changelogs || [])},
        screenshots = ${game.screenshots || []},
        updated_at = ${game.updatedAt || new Date().toISOString()},
        uploader_id = ${game.uploaderId || null},
        uploader_name = ${game.uploaderName || null}
      WHERE id = ${game.id}
    `;
  },

  deleteGame: async (id: string) => {
    await sql`DELETE FROM games WHERE id = ${id}`;
  },

  incrementViewCount: async (id: string) => {
    const rows = await sql`
      UPDATE games SET views_count = views_count + 1 WHERE id = ${id}
      RETURNING views_count
    `;
    return rows[0]?.views_count ?? 0;
  },

  incrementDownloadCount: async (id: string) => {
    const rows = await sql`
      UPDATE games SET downloads_count = downloads_count + 1 WHERE id = ${id}
      RETURNING downloads_count
    `;
    return rows[0]?.downloads_count ?? 0;
  },

  checkSlugExists: async (slug: string): Promise<boolean> => {
    const rows = await sql`SELECT 1 FROM games WHERE slug = ${slug}`;
    return rows.length > 0;
  },

  // ──────────── Bookmarks ────────────

  getBookmarks: async (): Promise<Bookmark[]> => {
    const rows = await sql`SELECT * FROM bookmarks`;
    return rows.map(rowToBookmark);
  },

  saveBookmarks: async (bookmarks: Bookmark[]) => {
    await sql`TRUNCATE bookmarks`;
    for (const b of bookmarks) {
      await sql`
        INSERT INTO bookmarks (user_id, game_id, created_at)
        VALUES (${b.userId}, ${b.gameId}, ${b.createdAt || new Date().toISOString()})
      `;
    }
  },

  toggleBookmark: async (userId: string, gameId: string): Promise<{ bookmarked: boolean; bookmarksCount: number }> => {
    // Check if bookmark exists
    const existing = await sql`
      SELECT 1 FROM bookmarks WHERE user_id = ${userId} AND game_id = ${gameId}
    `;

    if (existing.length > 0) {
      // Remove bookmark
      await sql`DELETE FROM bookmarks WHERE user_id = ${userId} AND game_id = ${gameId}`;
      const rows = await sql`
        UPDATE games SET bookmarks_count = GREATEST(0, bookmarks_count - 1) WHERE id = ${gameId}
        RETURNING bookmarks_count
      `;
      return { bookmarked: false, bookmarksCount: rows[0]?.bookmarks_count ?? 0 };
    } else {
      // Add bookmark
      await sql`
        INSERT INTO bookmarks (user_id, game_id, created_at) VALUES (${userId}, ${gameId}, NOW())
      `;
      const rows = await sql`
        UPDATE games SET bookmarks_count = bookmarks_count + 1 WHERE id = ${gameId}
        RETURNING bookmarks_count
      `;
      return { bookmarked: true, bookmarksCount: rows[0]?.bookmarks_count ?? 0 };
    }
  },

  getBookmarkedGames: async (userId: string): Promise<Game[]> => {
    const rows = await sql`
      SELECT g.* FROM games g
      INNER JOIN bookmarks b ON b.game_id = g.id
      WHERE b.user_id = ${userId}
    `;
    return rows.map(rowToGame);
  },

  // ──────────── Broken Reports ────────────

  getBrokenReports: async (): Promise<BrokenReport[]> => {
    const rows = await sql`SELECT * FROM broken_reports ORDER BY created_at DESC`;
    return rows.map(rowToReport);
  },

  saveBrokenReports: async (reports: BrokenReport[]) => {
    await sql`TRUNCATE broken_reports`;
    for (const r of reports) {
      await sql`
        INSERT INTO broken_reports (id, game_id, game_title, user_id, username, message, status, created_at)
        VALUES (${r.id}, ${r.gameId}, ${r.gameTitle}, ${r.userId}, ${r.username}, ${r.message}, ${r.status}, ${r.createdAt})
      `;
    }
  },

  addBrokenReport: async (report: BrokenReport) => {
    await sql`
      INSERT INTO broken_reports (id, game_id, game_title, user_id, username, message, status, created_at)
      VALUES (${report.id}, ${report.gameId}, ${report.gameTitle}, ${report.userId},
        ${report.username}, ${report.message}, ${report.status}, ${report.createdAt || new Date().toISOString()})
    `;
  },

  resolveReport: async (id: string) => {
    await sql`UPDATE broken_reports SET status = 'resolved' WHERE id = ${id}`;
  },

  // ──────────── Tags ────────────

  getTags: async (): Promise<Tag[]> => {
    const rows = await sql`SELECT * FROM tags`;
    return rows.map(rowToTag);
  },

  // ──────────── Filter Config ────────────

  getFilterConfig: async () => {
    const DEFAULT_GENRES = [
      'Romance', 'Drama', 'Slice of Life', 'Action', 'Fantasy', 'Mystery',
      'Sci-Fi', 'Psychological', 'Thriller', 'Gothic', 'Tragedy', 'Horror', 'School Life'
    ];
    const DEFAULT_ENGINES = ['RenPy', 'KiriKiri', 'Unity', 'RPG Maker', 'TyranoBuilder'];
    const DEFAULT_PLATFORMS = ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5'];

    const rows = await sql`SELECT * FROM filter_config WHERE id = 1`;
    if (rows.length === 0) {
      return { genres: DEFAULT_GENRES, engines: DEFAULT_ENGINES, platforms: DEFAULT_PLATFORMS };
    }
    const r = rows[0];
    return {
      genres: r.genres?.length > 0 ? r.genres : DEFAULT_GENRES,
      engines: r.engines?.length > 0 ? r.engines : DEFAULT_ENGINES,
      platforms: r.platforms?.length > 0 ? r.platforms : DEFAULT_PLATFORMS,
    };
  },

  saveFilterConfig: async (config: { genres?: string[]; engines?: string[]; platforms?: string[] }) => {
    const existing = await sql`SELECT 1 FROM filter_config WHERE id = 1`;
    if (existing.length === 0) {
      await sql`
        INSERT INTO filter_config (id, genres, engines, platforms)
        VALUES (1, ${config.genres || []}, ${config.engines || []}, ${config.platforms || []})
      `;
    } else {
      if (config.genres) await sql`UPDATE filter_config SET genres = ${config.genres} WHERE id = 1`;
      if (config.engines) await sql`UPDATE filter_config SET engines = ${config.engines} WHERE id = 1`;
      if (config.platforms) await sql`UPDATE filter_config SET platforms = ${config.platforms} WHERE id = 1`;
    }
  },

  // ──────────── Game Requests ────────────

  getGameRequests: async (): Promise<GameRequest[]> => {
    const rows = await sql`SELECT * FROM game_requests ORDER BY created_at DESC`;
    return rows.map(rowToGameRequest);
  },

  saveGameRequests: async (requests: GameRequest[]) => {
    await sql`TRUNCATE game_requests`;
    for (const r of requests) {
      await sql`
        INSERT INTO game_requests (id, title, original_name, link, engine, description, platforms, user_id, username, votes, status, created_at)
        VALUES (${r.id}, ${r.title}, ${r.originalName || ''}, ${r.link || ''}, ${r.engine || ''}, ${r.description || ''},
          ${r.platforms || ['Windows']}, ${r.userId}, ${r.username}, ${r.votes || []},
          ${r.status}, ${r.createdAt || new Date().toISOString()})
      `;
    }
  },

  addGameRequest: async (request: GameRequest) => {
    await sql`
      INSERT INTO game_requests (id, title, original_name, link, engine, description, platforms, user_id, username, votes, status, created_at)
      VALUES (${request.id}, ${request.title}, ${request.originalName || ''}, ${request.link || ''}, ${request.engine || ''}, ${request.description || ''},
        ${request.platforms || ['Windows']}, ${request.userId}, ${request.username}, ${request.votes || []},
        ${request.status}, ${request.createdAt || new Date().toISOString()})
    `;
  },

  updateGameRequestStatus: async (id: string, status: string) => {
    await sql`UPDATE game_requests SET status = ${status} WHERE id = ${id}`;
  },

  updateGameRequestVotes: async (id: string, votes: string[]) => {
    await sql`UPDATE game_requests SET votes = ${votes} WHERE id = ${id}`;
  },

  deleteGameRequest: async (id: string) => {
    await sql`DELETE FROM game_requests WHERE id = ${id}`;
  },

  getGameRequestById: async (id: string): Promise<GameRequest | null> => {
    const rows = await sql`SELECT * FROM game_requests WHERE id = ${id}`;
    return rows.length > 0 ? rowToGameRequest(rows[0]) : null;
  },

  findActiveRequestByUser: async (userId: string): Promise<GameRequest | null> => {
    const rows = await sql`
      SELECT * FROM game_requests
      WHERE user_id = ${userId} AND (status = 'Chờ duyệt' OR status = 'Đã duyệt')
      LIMIT 1
    `;
    return rows.length > 0 ? rowToGameRequest(rows[0]) : null;
  },

  // ──────────── Admin Stats ────────────

  getAdminStats: async () => {
    const [gamesResult, usersResult, reportsResult, requestsResult, downloadsResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM games`,
      sql`SELECT COUNT(*) as count FROM users`,
      sql`SELECT COUNT(*) as count FROM broken_reports WHERE status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM game_requests WHERE status = 'Chờ duyệt'`,
      sql`SELECT COALESCE(SUM(downloads_count), 0) as total FROM games`,
    ]);
    return {
      totalGames: parseInt(gamesResult[0].count),
      totalUsers: parseInt(usersResult[0].count),
      pendingReports: parseInt(reportsResult[0].count),
      pendingRequests: parseInt(requestsResult[0].count),
      totalDownloads: parseInt(downloadsResult[0].total),
    };
  },
};
