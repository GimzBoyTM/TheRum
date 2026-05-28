import express from 'express';
import path from 'path';
import { db } from '../src/db/dbService.js';
import { Game, User, BrokenReport, GameRequest } from '../src/types.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // Simple token helper (Base64 wrapper for session payload)
  const generateToken = (user: User) => {
    return Buffer.from(JSON.stringify({ id: user.id, username: user.username, role: user.role, email: user.email })).toString('base64');
  };

  const verifyToken = (token: string): User | null => {
    try {
      const payloadStr = Buffer.from(token, 'base64').toString('utf-8');
      const payload = JSON.parse(payloadStr);
      if (payload && payload.id && payload.role) {
        return payload;
      }
    } catch {
      // Ignored
    }
    return null;
  };

  // Middleware for checking Auth
  const authMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(418).json({ error: 'Chưa đăng nhập' });
    }
    const token = authHeader.split(' ')[1];
    const user = verifyToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    req.user = user;
    next();
  };

  const adminMiddleware = (req: any, res: any, next: any) => {
    authMiddleware(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Bạn không có quyền quản trị viên' });
      }
      next();
    });
  };

  const adminOrDichGiaMiddleware = (req: any, res: any, next: any) => {
    authMiddleware(req, res, () => {
      if (req.user.role !== 'admin' && req.user.role !== 'dichgia') {
        return res.status(403).json({ error: 'Bạn không có quyền đăng tải hoặc cập nhật game (Chỉ dành cho Dịch giả & Admin)' });
      }
      next();
    });
  };

  // =================== API ENDPOINTS ===================

  // 1. Authentication
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password, captchaVerified } = req.body;
    if (!captchaVerified) {
      return res.status(400).json({ error: 'Vui lòng hoàn thành xác thực robot' });
    }
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đăng ký' });
    }

    const users = db.getUsers();
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Tên tài khoản này đã tồn tại' });
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email này đã tồn tại' });
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      username,
      email,
      password, // simplistic password storage for demo/sandbox integrity
      role: 'user',
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`
    };

    db.addUser(newUser);

    const token = generateToken(newUser);
    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role, avatarUrl: newUser.avatarUrl }
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { usernameOrEmail, password, captchaVerified } = req.body;
    if (!captchaVerified) {
      return res.status(400).json({ error: 'Vui lòng hoàn thành xác thực robot' });
    }
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ error: 'Vui lòng điền tài khoản và mật khẩu' });
    }

    const users = db.getUsers();
    const user = users.find(u =>
      (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
      u.password === password
    );

    if (!user) {
      return res.status(401).json({ error: 'Thông tin tài khoản hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
    });
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    const token = authHeader.split(' ')[1];
    const userPayload = verifyToken(token);
    if (!userPayload) {
      return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    // Refresh user data
    const users = db.getUsers();
    const user = users.find(u => u.id === userPayload.id);
    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
    }

    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
    });
  });

  // 2. Games Catalog & Filters
  app.get('/api/games', (req, res) => {
    const { search, tag, engine, platform, status, sortBy, page } = req.query;
    let filteredGames = db.getGames();

    // Text search
    if (search) {
      const q = String(search).toLowerCase();
      filteredGames = filteredGames.filter(g =>
        g.title.toLowerCase().includes(q) ||
        g.shortDescription.toLowerCase().includes(q) ||
        g.developer.toLowerCase().includes(q) ||
        g.creator.toLowerCase().includes(q)
      );
    }

    // Tag filter
    if (tag) {
      const isArr = Array.isArray(tag);
      const tagsToFilter = isArr ? (tag as string[]) : [String(tag)];
      filteredGames = filteredGames.filter(g =>
        tagsToFilter.every(t => g.tags.includes(t))
      );
    }

    // Engine filter
    if (engine) {
      filteredGames = filteredGames.filter(g => g.engine.toLowerCase() === String(engine).toLowerCase());
    }

    // Platform filter
    if (platform) {
      filteredGames = filteredGames.filter(g => g.platforms.some(p => p.toLowerCase() === String(platform).toLowerCase()));
    }

    // Status filter
    if (status) {
      filteredGames = filteredGames.filter(g => g.status.toLowerCase() === String(status).toLowerCase());
    }

    // Sorting
    if (sortBy) {
      const sort = String(sortBy);
      if (sort === 'views') {
        filteredGames.sort((a, b) => b.viewsCount - a.viewsCount);
      } else if (sort === 'downloads') {
        filteredGames.sort((a, b) => b.downloadsCount - a.downloadsCount);
      } else if (sort === 'bookmarks') {
        filteredGames.sort((a, b) => b.bookmarksCount - a.bookmarksCount);
      } else if (sort === 'newest') {
        filteredGames.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sort === 'alphabetical') {
        filteredGames.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // default update time
        filteredGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
    } else {
      // default newest updated
      filteredGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }

    // Pagination
    const limit = 6;
    const activePage = Math.max(1, parseInt(String(page || 1)));
    const totalCount = filteredGames.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedGames = filteredGames.slice((activePage - 1) * limit, activePage * limit);

    res.json({
      games: paginatedGames,
      pagination: {
        totalCount,
        totalPages,
        currentPage: activePage,
        limit
      }
    });
  });

  app.get('/api/games/tags', (req, res) => {
    res.json(db.getTags());
  });

  app.get('/api/config', (req, res) => {
    res.json(db.getFilterConfig());
  });

  app.post('/api/config', adminMiddleware, (req, res) => {
    const { genres, engines, platforms } = req.body;
    db.saveFilterConfig({ genres, engines, platforms });
    res.json({ message: 'Cập nhật danh sách bộ lọc cấu hình thành công!', config: db.getFilterConfig() });
  });

  app.get('/api/games/:slug', (req, res) => {
    const games = db.getGames();
    const gameIndex = games.findIndex(g => g.slug === req.params.slug);
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy tựa game này' });
    }

    // Increment view count dynamically
    games[gameIndex].viewsCount += 1;
    db.saveGames(games);

    res.json(games[gameIndex]);
  });

  // Increment download count (called when user clicks download)
  app.post('/api/games/:id/download-click', (req, res) => {
    const games = db.getGames();
    const game = games.find(g => g.id === req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Không tìm thấy game' });
    }
    game.downloadsCount += 1;
    db.saveGames(games);
    res.json({ count: game.downloadsCount });
  });

  // 3. User Actions (Bookmarks, Reports)
  app.post('/api/games/:id/bookmark', authMiddleware, (req: any, res) => {
    const userId = req.user.id;
    const gameId = req.params.id;

    const games = db.getGames();
    const game = games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ error: 'Không tìm thấy tựa game' });
    }

    let bookmarks = db.getBookmarks();
    const idx = bookmarks.findIndex(b => b.userId === userId && b.gameId === gameId);
    let bookmarked = false;

    if (idx !== -1) {
      // Remove
      bookmarks.splice(idx, 1);
      game.bookmarksCount = Math.max(0, game.bookmarksCount - 1);
      bookmarked = false;
    } else {
      // Add
      bookmarks.push({ userId, gameId, createdAt: new Date().toISOString() });
      game.bookmarksCount += 1;
      bookmarked = true;
    }

    db.saveBookmarks(bookmarks);
    db.saveGames(games);

    res.json({ bookmarked, bookmarksCount: game.bookmarksCount });
  });

  app.get('/api/users/bookmarks', authMiddleware, (req: any, res) => {
    const userId = req.user.id;
    const bookmarks = db.getBookmarks().filter(b => b.userId === userId);
    const games = db.getGames();
    const bookmarkedGames = games.filter(g => bookmarks.some(b => b.gameId === g.id));
    res.json(bookmarkedGames);
  });

  app.post('/api/games/:id/report', authMiddleware, (req: any, res) => {
    const { message } = req.body;
    const gameId = req.params.id;
    const userId = req.user.id;
    const username = req.user.username;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Vui lòng cung cấp nội dung báo lỗi' });
    }

    const games = db.getGames();
    const game = games.find(g => g.id === gameId);
    if (!game) {
      return res.status(404).json({ error: 'Không tìm thấy tựa game' });
    }

    const reports = db.getBrokenReports();
    const newReport: BrokenReport = {
      id: 'rep-' + Date.now(),
      gameId,
      gameTitle: game.title,
      userId,
      username,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    reports.push(newReport);
    db.saveBrokenReports(reports);

    res.status(201).json({ message: 'Báo lỗi liên kết tải thành công! Quản trị viên của TheRum sẽ khắc phục sớm nhất.' });
  });

  // 3.5 Game Requests API
  app.get('/api/requests', (req, res) => {
    try {
      const requests = db.getGameRequests();
      // Sort by vote count descending, then by newest
      requests.sort((a, b) => {
        const diff = (b.votes?.length || 0) - (a.votes?.length || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tải danh sách yêu cầu' });
    }
  });

  app.post('/api/requests', authMiddleware, (req: any, res) => {
    const { title, originalName, description, platforms } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Vui lòng nhập tên game yêu cầu' });
    }

    try {
      const requests = db.getGameRequests();

      // Check if user has an active request in "Chờ duyệt" or "Đã duyệt" status
      const activeRequest = requests.find(r => r.userId === req.user.id && (r.status === 'Chờ duyệt' || r.status === 'Đã duyệt'));
      if (activeRequest) {
        return res.status(400).json({
          error: `Bạn đã gửi một yêu cầu ("${activeRequest.title}") đang ở trạng thái "${activeRequest.status}". Vui lòng đợi nhóm dịch xử lý chuyển sang "Đang tiến hành" hoặc "Đã hoàn thành" để có thể tiếp tục gửi yêu cầu mới!`
        });
      }

      const newRequest: GameRequest = {
        id: 'req-' + Date.now(),
        title: title.trim(),
        originalName: originalName?.trim() || '',
        description: description?.trim() || '',
        platforms: Array.isArray(platforms) && platforms.length > 0 ? platforms : ['Windows'],
        userId: req.user.id,
        username: req.user.username,
        votes: [req.user.id], // Request creator votes for their own request by default
        status: 'Chờ duyệt',
        createdAt: new Date().toISOString()
      };

      requests.push(newRequest);
      db.saveGameRequests(requests);
      res.status(201).json(newRequest);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể gửi yêu cầu dịch game' });
    }
  });

  app.post('/api/requests/:id/vote', authMiddleware, (req: any, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const requests = db.getGameRequests();
      const reqIndex = requests.findIndex(r => r.id === id);
      if (reqIndex === -1) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu dịch game này' });
      }

      const request = requests[reqIndex];
      if (!request.votes) {
        request.votes = [];
      }

      const voteIdx = request.votes.indexOf(userId);
      let voted = false;
      if (voteIdx !== -1) {
        request.votes.splice(voteIdx, 1); // unvote
        voted = false;
      } else {
        request.votes.push(userId); // vote
        voted = true;
      }

      db.saveGameRequests(requests);
      res.json({ voted, votesCount: request.votes.length, votes: request.votes });
    } catch (err: any) {
      res.status(500).json({ error: 'Có lỗi xảy ra khi bình chọn' });
    }
  });

  app.post('/api/requests/:id/status', adminMiddleware, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Chờ duyệt', 'Đã duyệt', 'Đang tiến hành', 'Đã hoàn thành'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
    }

    try {
      const requests = db.getGameRequests();
      const reqIndex = requests.findIndex(r => r.id === id);
      if (reqIndex === -1) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
      }

      requests[reqIndex].status = status as any;
      db.saveGameRequests(requests);
      res.json(requests[reqIndex]);
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật trạng thái' });
    }
  });

  app.delete('/api/requests/:id', adminMiddleware, (req, res) => {
    const { id } = req.params;

    try {
      const requests = db.getGameRequests();
      const reqIndex = requests.findIndex(r => r.id === id);
      if (reqIndex === -1) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu cần xóa' });
      }

      requests.splice(reqIndex, 1);
      db.saveGameRequests(requests);
      res.json({ message: 'Đã xóa yêu cầu thành công' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa yêu cầu' });
    }
  });

  // 4. Admin operations (Dashboard, Add, Edit, Delete Games, Manage Reports)
  app.get('/api/admin/stats', adminMiddleware, (req, res) => {
    const games = db.getGames();
    const users = db.getUsers();
    const reports = db.getBrokenReports();
    const requests = db.getGameRequests();

    const totalGames = games.length;
    const totalUsers = users.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const pendingRequests = requests.filter(r => r.status === 'Chờ duyệt').length;
    const totalDownloads = games.reduce((sum, g) => sum + g.downloadsCount, 0);

    res.json({
      totalGames,
      totalUsers,
      pendingReports,
      pendingRequests,
      totalDownloads
    });
  });

  app.get('/api/admin/reports', adminMiddleware, (req, res) => {
    res.json(db.getBrokenReports());
  });

  app.post('/api/admin/reports/:id/resolve', adminMiddleware, (req, res) => {
    const reports = db.getBrokenReports();
    const reportIndex = reports.findIndex(r => r.id === req.params.id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy báo cáo' });
    }

    reports[reportIndex].status = 'resolved';
    db.saveBrokenReports(reports);
    res.json({ message: 'Đã giải quyết báo lỗi liên kết thành công' });
  });

  app.get('/api/admin/backup', adminMiddleware, (req, res) => {
    try {
      const data = db.getData();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=therum-db-backup.json');
      res.send(JSON.stringify(data, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tạo bản sao lưu dữ liệu' });
    }
  });

  app.post('/api/admin/restore', adminMiddleware, (req, res) => {
    try {
      const newData = req.body;
      if (!newData || !Array.isArray(newData.users) || !Array.isArray(newData.games) || !Array.isArray(newData.tags)) {
        return res.status(400).json({ error: 'Cấu trúc dữ liệu phục hồi không hợp lệ! Bản sao lưu cần chứa danh sách users, games và tags.' });
      }
      db.saveData(newData);
      res.json({ message: 'Khôi phục dữ liệu ứng dụng thành công!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể khôi phục dữ liệu: ' + err.message });
    }
  });

  // Create Game
  app.post('/api/games', adminOrDichGiaMiddleware, (req: any, res) => {
    const { title, shortDescription, description, coverUrl, bannerUrl, developer, publisher, status, engine, platforms, ageRating, tags, downloadLinks, screenshots } = req.body;

    if (!title || !shortDescription || !description || !status || !engine) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin chính của game' });
    }

    const slug = title.toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accent marks
      .replace(/đ/g, 'd').replace(/Đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const games = db.getGames();
    if (games.some(g => g.slug === slug)) {
      return res.status(400).json({ error: 'Tiêu đề game trùng hợp hoặc trùng lặp slug, vui lòng thay tên khác' });
    }

    const newGame: Game = {
      id: 'game-' + Date.now(),
      title,
      slug,
      shortDescription,
      description,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&h=600&q=80',
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&h=400&q=80',
      creator: req.user.username || 'TheRum',
      developer: developer || 'Chưa rõ',
      publisher: publisher || 'Chưa rõ',
      status,
      engine,
      platforms: platforms || ['Windows'],
      ageRating: ageRating || '16+',
      viewsCount: 0,
      downloadsCount: 0,
      bookmarksCount: 0,
      tags: tags || [],
      downloadLinks: downloadLinks || [],
      changelogs: [{ version: 'v1.0', date: new Date().toISOString().split('T')[0], content: 'Chương trình phát hành bản dịch đầu tiên.' }],
      screenshots: screenshots || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploaderId: req.user.id,
      uploaderName: req.user.username
    };

    db.addGame(newGame);
    res.status(201).json(newGame);
  });

  // Edit Game
  app.put('/api/games/:id', adminOrDichGiaMiddleware, (req: any, res) => {
    const { title, shortDescription, description, coverUrl, bannerUrl, developer, publisher, status, engine, platforms, ageRating, tags, downloadLinks, screenshots, changelogs } = req.body;
    const gameId = req.params.id;

    const games = db.getGames();
    const gameIndex = games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy tựa game này' });
    }

    // Role check: If translator, they must be the uploader of this game
    if (req.user.role === 'dichgia' && games[gameIndex].uploaderId !== req.user.id) {
      return res.status(403).json({ error: 'Bạn chỉ có quyền sửa game do chính mình đăng tải' });
    }

    const updatedGame: Game = {
      ...games[gameIndex],
      title: title || games[gameIndex].title,
      shortDescription: shortDescription || games[gameIndex].shortDescription,
      description: description || games[gameIndex].description,
      coverUrl: coverUrl || games[gameIndex].coverUrl,
      bannerUrl: bannerUrl || games[gameIndex].bannerUrl,
      developer: developer || games[gameIndex].developer,
      publisher: publisher || games[gameIndex].publisher,
      status: status || games[gameIndex].status,
      engine: engine || games[gameIndex].engine,
      platforms: platforms || games[gameIndex].platforms,
      ageRating: ageRating || games[gameIndex].ageRating,
      tags: tags || games[gameIndex].tags,
      downloadLinks: downloadLinks || games[gameIndex].downloadLinks,
      screenshots: screenshots || games[gameIndex].screenshots,
      changelogs: changelogs || games[gameIndex].changelogs,
      updatedAt: new Date().toISOString()
    };

    games[gameIndex] = updatedGame;
    db.saveGames(games);
    res.json(updatedGame);
  });

  // Delete Game
  app.delete('/api/games/:id', adminOrDichGiaMiddleware, (req: any, res) => {
    const games = db.getGames();
    const gameIndex = games.findIndex(g => g.id === req.params.id);
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy game cần xóa' });
    }

    // Role check: If translator, they must be the uploader of this game
    if (req.user.role === 'dichgia' && games[gameIndex].uploaderId !== req.user.id) {
      return res.status(403).json({ error: 'Bạn chỉ có quyền xóa game do chính mình đăng tải' });
    }

    games.splice(gameIndex, 1);
    db.saveGames(games);
    res.json({ message: 'Đã xóa game thành công' });
  });

  // User accounts management (admin-only)
  app.get('/api/admin/users', adminMiddleware, (req, res) => {
    const users = db.getUsers().map(({ id, username, email, role, avatarUrl }) => ({ id, username, email, role, avatarUrl }));
    res.json(users);
  });

  app.put('/api/admin/users/:id', adminMiddleware, (req, res) => {
    const { role } = req.body;
    if (!role || !['user', 'admin', 'dichgia'].includes(role)) {
      return res.status(400).json({ error: 'Vai trò người dùng không hợp lệ' });
    }

    const { id } = req.params;
    if (id === 'admin-therum') {
      return res.status(400).json({ error: 'Không thể thay đổi phân quyền của tài khoản Admin gốc!' });
    }

    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
    }

    users[userIndex].role = role as any;
    db.saveUsers(users);
    res.json({ message: 'Cập nhật phân quyền người dùng thành công!', user: { id, role } });
  });

  app.delete('/api/admin/users/:id', adminMiddleware, (req, res) => {
    const { id } = req.params;
    if (id === 'admin-therum') {
      return res.status(400).json({ error: 'Không thể xóa Admin hệ thống mặc định!' });
    }

    const users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy người dùng cần xóa!' });
    }

    users.splice(userIndex, 1);
    db.saveUsers(users);
    res.json({ message: 'Xóa tài khoản người dùng khỏi hệ thống thành công!' });
  });

  const isProd = process.env.NODE_ENV === 'production' || 
                 process.env.VERCEL === '1' || 
                 (typeof __filename !== 'undefined' && __filename.endsWith('.cjs')) || 
                 (typeof __dirname !== 'undefined' && __dirname.includes('dist'));

  // Vite development server setup
  if (!isProd) {
    const viteModuleName = 'vite';
    import(viteModuleName).then(({ createServer: createViteServer }) => {
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }).then(vite => {
        app.use(vite.middlewares);
        if (!process.env.VERCEL) {
          app.listen(PORT, '0.0.0.0', () => {
            console.log(`TheRum custom backend server running on http://0.0.0.0:${PORT} (dev)`);
          });
        }
      }).catch(err => {
        console.error("Failed to start Vite dev server:", err);
      });
    });
  } else {
    const distPath = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    if (!process.env.VERCEL) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`TheRum custom backend server running on http://0.0.0.0:${PORT} (prod)`);
      });
    }
  }

export default app;
