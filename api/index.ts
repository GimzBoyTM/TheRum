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
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, captchaVerified } = req.body;
      if (!captchaVerified) {
        return res.status(400).json({ error: 'Vui lòng hoàn thành xác thực robot' });
      }
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin đăng ký' });
      }

      if (await db.checkUsernameExists(username)) {
        return res.status(400).json({ error: 'Tên tài khoản này đã tồn tại' });
      }
      if (await db.checkEmailExists(email)) {
        return res.status(400).json({ error: 'Email này đã tồn tại' });
      }

      const newUser: User = {
        id: 'user-' + Date.now(),
        username,
        email,
        password,
        role: 'user',
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`
      };

      await db.addUser(newUser);

      const token = generateToken(newUser);
      res.status(201).json({
        message: 'Đăng ký thành công',
        token,
        user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role, avatarUrl: newUser.avatarUrl }
      });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi đăng ký' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { usernameOrEmail, password, captchaVerified } = req.body;
      if (!captchaVerified) {
        return res.status(400).json({ error: 'Vui lòng hoàn thành xác thực robot' });
      }
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Vui lòng điền tài khoản và mật khẩu' });
      }

      const user = await db.findUserByLogin(usernameOrEmail, password);
      if (!user) {
        return res.status(401).json({ error: 'Thông tin tài khoản hoặc mật khẩu không đúng' });
      }

      const token = generateToken(user);
      res.json({
        message: 'Đăng nhập thành công',
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi đăng nhập' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
      }
      const token = authHeader.split(' ')[1];
      const userPayload = verifyToken(token);
      if (!userPayload) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
      }

      const user = await db.getUserById(userPayload.id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
      }

      res.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role, avatarUrl: user.avatarUrl }
      });
    } catch (err: any) {
      console.error('Auth/me error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  // Change Password
  app.put('/api/auth/change-password', authMiddleware, async (req: any, res) => {
    try {
      const { currentPassword, newPassword, captchaVerified } = req.body;

      if (!captchaVerified) {
        return res.status(400).json({ error: 'Vui lòng hoàn thành xác thực robot' });
      }
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới' });
      }
      if (newPassword.length < 4) {
        return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
      }

      // Verify current password
      const user = await db.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng' });
      }
      if (user.password !== currentPassword) {
        return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
      }

      await db.updateUserPassword(req.user.id, newPassword);
      res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err: any) {
      console.error('Change password error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi đổi mật khẩu' });
    }
  });

  // 2. Games Catalog & Filters
  app.get('/api/games', async (req, res) => {
    try {
      const { search, tag, engine, platform, status, sortBy, page } = req.query;
      let filteredGames = await db.getGames();

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
          filteredGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
      } else {
        filteredGames.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }

      // Pagination
      const limit = 6;
      const activePage = Math.max(1, parseInt(String(page || 1)));
      const totalCount = filteredGames.length;
      const totalPages = Math.ceil(totalCount / limit);
      const paginatedGames = filteredGames.slice((activePage - 1) * limit, activePage * limit);

      // Check authentication to sanitize download links
      const authHeader = req.headers.authorization;
      let authenticated = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const userPayload = verifyToken(token);
        if (userPayload) {
          authenticated = true;
        }
      }

      const sanitizedGames = paginatedGames.map(g => {
        if (!authenticated) {
          return { ...g, downloadLinks: [] };
        }
        return g;
      });

      res.json({
        games: sanitizedGames,
        pagination: {
          totalCount,
          totalPages,
          currentPage: activePage,
          limit
        }
      });
    } catch (err: any) {
      console.error('GET /api/games error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi tải danh sách game' });
    }
  });

  app.get('/api/games/tags', async (req, res) => {
    try {
      res.json(await db.getTags());
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi tải tags' });
    }
  });

  app.get('/api/config', async (req, res) => {
    try {
      res.json(await db.getFilterConfig());
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi tải cấu hình' });
    }
  });

  app.post('/api/config', adminMiddleware, async (req, res) => {
    try {
      const { genres, engines, platforms } = req.body;
      await db.saveFilterConfig({ genres, engines, platforms });
      const config = await db.getFilterConfig();
      res.json({ message: 'Cập nhật danh sách bộ lọc cấu hình thành công!', config });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi cập nhật cấu hình' });
    }
  });

  app.get('/api/games/:slug', async (req, res) => {
    try {
      const game = await db.getGameBySlug(req.params.slug);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy tựa game này' });
      }

      // Increment view count
      await db.incrementViewCount(game.id);
      game.viewsCount += 1;

      // Check authentication to sanitize download links
      const authHeader = req.headers.authorization;
      let authenticated = false;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const userPayload = verifyToken(token);
        if (userPayload) {
          authenticated = true;
        }
      }

      const gameResponse = { ...game };
      if (!authenticated) {
        gameResponse.downloadLinks = [];
      }

      res.json(gameResponse);
    } catch (err: any) {
      console.error('GET /api/games/:slug error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  // Increment download count (called when user clicks download)
  app.post('/api/games/:id/download-click', async (req, res) => {
    try {
      const game = await db.getGameById(req.params.id);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy game' });
      }
      const count = await db.incrementDownloadCount(req.params.id);
      res.json({ count });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  // 3. User Actions (Bookmarks, Reports)
  app.post('/api/games/:id/bookmark', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const gameId = req.params.id;

      const game = await db.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy tựa game' });
      }

      const result = await db.toggleBookmark(userId, gameId);
      res.json(result);
    } catch (err: any) {
      console.error('Bookmark error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  app.get('/api/users/bookmarks', authMiddleware, async (req: any, res) => {
    try {
      const bookmarkedGames = await db.getBookmarkedGames(req.user.id);
      res.json(bookmarkedGames);
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi tải danh sách bookmark' });
    }
  });

  app.post('/api/games/:id/report', authMiddleware, async (req: any, res) => {
    try {
      const { message } = req.body;
      const gameId = req.params.id;
      const userId = req.user.id;
      const username = req.user.username;

      if (!message || message.trim() === '') {
        return res.status(400).json({ error: 'Vui lòng cung cấp nội dung báo lỗi' });
      }

      const game = await db.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy tựa game' });
      }

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

      await db.addBrokenReport(newReport);

      res.status(201).json({ message: 'Báo lỗi liên kết tải thành công! Quản trị viên của TheRum sẽ khắc phục sớm nhất.' });
    } catch (err: any) {
      console.error('Report error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  // 3.5 Game Requests API
  app.get('/api/requests', async (req, res) => {
    try {
      const requests = await db.getGameRequests();
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

  app.post('/api/requests', authMiddleware, async (req: any, res) => {
    try {
      const { title, originalName, description, platforms } = req.body;
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Vui lòng nhập tên game yêu cầu' });
      }

      // Check if user has an active request
      const activeRequest = await db.findActiveRequestByUser(req.user.id);
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
        votes: [req.user.id],
        status: 'Chờ duyệt',
        createdAt: new Date().toISOString()
      };

      await db.addGameRequest(newRequest);
      res.status(201).json(newRequest);
    } catch (err: any) {
      console.error('Create request error:', err);
      res.status(500).json({ error: 'Không thể gửi yêu cầu dịch game' });
    }
  });

  app.post('/api/requests/:id/vote', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const request = await db.getGameRequestById(id);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu dịch game này' });
      }

      const votes = request.votes || [];
      const voteIdx = votes.indexOf(userId);
      let voted = false;

      if (voteIdx !== -1) {
        votes.splice(voteIdx, 1);
        voted = false;
      } else {
        votes.push(userId);
        voted = true;
      }

      await db.updateGameRequestVotes(id, votes);
      res.json({ voted, votesCount: votes.length, votes });
    } catch (err: any) {
      res.status(500).json({ error: 'Có lỗi xảy ra khi bình chọn' });
    }
  });

  app.post('/api/requests/:id/status', adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['Chờ duyệt', 'Đã duyệt', 'Đang tiến hành', 'Đã hoàn thành'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      }

      const request = await db.getGameRequestById(id);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu' });
      }

      await db.updateGameRequestStatus(id, status);
      res.json({ ...request, status });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể cập nhật trạng thái' });
    }
  });

  app.delete('/api/requests/:id', adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const request = await db.getGameRequestById(id);
      if (!request) {
        return res.status(404).json({ error: 'Không tìm thấy yêu cầu cần xóa' });
      }

      await db.deleteGameRequest(id);
      res.json({ message: 'Đã xóa yêu cầu thành công' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể xóa yêu cầu' });
    }
  });

  // 4. Admin operations (Dashboard, Add, Edit, Delete Games, Manage Reports)
  app.get('/api/admin/stats', adminMiddleware, async (req, res) => {
    try {
      const stats = await db.getAdminStats();
      res.json(stats);
    } catch (err: any) {
      console.error('Admin stats error:', err);
      res.status(500).json({ error: 'Lỗi tải thống kê' });
    }
  });

  app.get('/api/admin/reports', adminMiddleware, async (req, res) => {
    try {
      res.json(await db.getBrokenReports());
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi tải báo cáo' });
    }
  });

  app.post('/api/admin/reports/:id/resolve', adminMiddleware, async (req, res) => {
    try {
      await db.resolveReport(req.params.id);
      res.json({ message: 'Đã giải quyết báo lỗi liên kết thành công' });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi máy chủ' });
    }
  });

  app.get('/api/admin/backup', adminMiddleware, async (req, res) => {
    try {
      const data = await db.getData();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=therum-db-backup.json');
      res.send(JSON.stringify(data, null, 2));
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể tạo bản sao lưu dữ liệu' });
    }
  });

  app.post('/api/admin/restore', adminMiddleware, async (req, res) => {
    try {
      const newData = req.body;
      if (!newData || !Array.isArray(newData.users) || !Array.isArray(newData.games) || !Array.isArray(newData.tags)) {
        return res.status(400).json({ error: 'Cấu trúc dữ liệu phục hồi không hợp lệ! Bản sao lưu cần chứa danh sách users, games và tags.' });
      }
      await db.saveData(newData);
      res.json({ message: 'Khôi phục dữ liệu ứng dụng thành công!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Không thể khôi phục dữ liệu: ' + err.message });
    }
  });

  // Create Game
  app.post('/api/games', adminOrDichGiaMiddleware, async (req: any, res) => {
    try {
      const { title, shortDescription, description, coverUrl, bannerUrl, developer, publisher, status, engine, platforms, ageRating, tags, downloadLinks, screenshots } = req.body;

      if (!title || !shortDescription || !description || !status || !engine) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ các thông tin chính của game' });
      }

      const slug = title.toLowerCase()
        .trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      if (await db.checkSlugExists(slug)) {
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

      await db.addGame(newGame);
      res.status(201).json(newGame);
    } catch (err: any) {
      console.error('Create game error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi tạo game' });
    }
  });

  // Edit Game
  app.put('/api/games/:id', adminOrDichGiaMiddleware, async (req: any, res) => {
    try {
      const { title, shortDescription, description, coverUrl, bannerUrl, developer, publisher, status, engine, platforms, ageRating, tags, downloadLinks, screenshots, changelogs } = req.body;
      const gameId = req.params.id;

      const game = await db.getGameById(gameId);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy tựa game này' });
      }

      // Role check: If translator, they must be the uploader of this game
      if (req.user.role === 'dichgia' && game.uploaderId !== req.user.id) {
        return res.status(403).json({ error: 'Bạn chỉ có quyền sửa game do chính mình đăng tải' });
      }

      const updatedGame: Game = {
        ...game,
        title: title || game.title,
        shortDescription: shortDescription || game.shortDescription,
        description: description || game.description,
        coverUrl: coverUrl || game.coverUrl,
        bannerUrl: bannerUrl || game.bannerUrl,
        developer: developer || game.developer,
        publisher: publisher || game.publisher,
        status: status || game.status,
        engine: engine || game.engine,
        platforms: platforms || game.platforms,
        ageRating: ageRating || game.ageRating,
        tags: tags || game.tags,
        downloadLinks: downloadLinks || game.downloadLinks,
        screenshots: screenshots || game.screenshots,
        changelogs: changelogs || game.changelogs,
        updatedAt: new Date().toISOString()
      };

      await db.updateGame(updatedGame);
      res.json(updatedGame);
    } catch (err: any) {
      console.error('Update game error:', err);
      res.status(500).json({ error: 'Lỗi máy chủ khi cập nhật game' });
    }
  });

  // Delete Game
  app.delete('/api/games/:id', adminOrDichGiaMiddleware, async (req: any, res) => {
    try {
      const game = await db.getGameById(req.params.id);
      if (!game) {
        return res.status(404).json({ error: 'Không tìm thấy game cần xóa' });
      }

      // Role check: If translator, they must be the uploader of this game
      if (req.user.role === 'dichgia' && game.uploaderId !== req.user.id) {
        return res.status(403).json({ error: 'Bạn chỉ có quyền xóa game do chính mình đăng tải' });
      }

      await db.deleteGame(req.params.id);
      res.json({ message: 'Đã xóa game thành công' });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi máy chủ khi xóa game' });
    }
  });

  // User accounts management (admin-only)
  app.get('/api/admin/users', adminMiddleware, async (req, res) => {
    try {
      const users = (await db.getUsers()).map(({ id, username, email, role, avatarUrl }) => ({ id, username, email, role, avatarUrl }));
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi tải danh sách người dùng' });
    }
  });

  app.put('/api/admin/users/:id', adminMiddleware, async (req, res) => {
    try {
      const { role } = req.body;
      if (!role || !['user', 'admin', 'dichgia'].includes(role)) {
        return res.status(400).json({ error: 'Vai trò người dùng không hợp lệ' });
      }

      const { id } = req.params;
      if (id === 'admin-therum') {
        return res.status(400).json({ error: 'Không thể thay đổi phân quyền của tài khoản Admin gốc!' });
      }

      const user = await db.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng này' });
      }

      await db.updateUserRole(id, role);
      res.json({ message: 'Cập nhật phân quyền người dùng thành công!', user: { id, role } });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi cập nhật phân quyền' });
    }
  });

  app.delete('/api/admin/users/:id', adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      if (id === 'admin-therum') {
        return res.status(400).json({ error: 'Không thể xóa Admin hệ thống mặc định!' });
      }

      const user = await db.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy người dùng cần xóa!' });
      }

      await db.deleteUser(id);
      res.json({ message: 'Xóa tài khoản người dùng khỏi hệ thống thành công!' });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi xóa người dùng' });
    }
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
