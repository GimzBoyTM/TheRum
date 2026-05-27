import { useState, useEffect } from 'react';
import Header from './components/Header';
import SidebarFilter from './components/SidebarFilter';
import GameCard from './components/GameCard';
import GameDetail from './components/GameDetail';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import GameRequests from './components/GameRequests';
import DonateModal from './components/DonateModal';
import AgeVerification from './components/AgeVerification';
import { Game, User } from './types';
import { Sparkles, Calendar, BookOpen, Key, Link2, Monitor, AlertCircle, Compass, RotateCcw, ChevronLeft, ChevronRight, Lock, BookMarked, UserCheck, ChevronDown, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SORT_OPTIONS = [
  { value: 'newest_updated', label: 'Mới Cập Nhật Nhật ký' },
  { value: 'newest', label: 'Ngày Đăng Mới' },
  { value: 'views', label: 'Lượt Xem nhiều' },
  { value: 'downloads', label: 'Tải Nhiều nhất' },
  { value: 'bookmarks', label: 'Yêu thích nhất' },
  { value: 'alphabetical', label: 'Tên Game A-Z' },
];

export default function App() {
  // Age confirmation state
  const [isAgeConfirmed, setIsAgeConfirmed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('therum_age_confirmed') === 'true';
    } catch {
      return false;
    }
  });

  const handleConfirmAge = () => {
    try {
      localStorage.setItem('therum_age_confirmed', 'true');
    } catch (err) {
      console.error("Failed to save age confirmation:", err);
    }
    setIsAgeConfirmed(true);
  };

  // Navigation Router states based on simple hashes (e.g. '', '#/game/yosuga-no-sora', '#/admin', '#/bookmarks')
  const [currentRoute, setCurrentRoute] = useState('/');
  const [activeSlug, setActiveSlug] = useState('');

  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Filter and games data states
  const [games, setGames] = useState<Game[]>([]);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1, currentPage: 1 });
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedEngine, setSelectedEngine] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest_updated');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingGames, setLoadingGames] = useState(false);
  const [isDonateOpen, setIsDonateOpen] = useState(false);

  // Filter lists fetched dynamically from backend config
  const [filterConfig, setFilterConfig] = useState<{ genres: string[]; engines: string[]; platforms: string[] }>({
    genres: [],
    engines: [],
    platforms: []
  });

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setFilterConfig(data);
      }
    } catch (err) {
      console.error("Error retrieving filter configs:", err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Active loaded game for detail view
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [loadingActiveGame, setLoadingActiveGame] = useState(false);

  // User's bookmarks cache
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Sync hash routing on window load or popstate
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '#/';
      if (hash.startsWith('#/game/')) {
        const slug = hash.replace('#/game/', '');
        setActiveSlug(slug);
        setCurrentRoute('/game');
      } else if (hash === '#/admin') {
        setCurrentRoute('/admin');
      } else if (hash === '#/requests') {
        setCurrentRoute('/requests');
      } else if (hash === '#/bookmarks') {
        setCurrentRoute('/bookmarks');
      } else {
        setCurrentRoute('/');
        setActiveSlug('');
      }
    };

    window.addEventListener('popstate', handleHash);
    // Trigger on mount
    handleHash();

    return () => {
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  // Sync user status on mount
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('therum_token');
      if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            fetchUserBookmarks();
          } else {
            // clear stale session
            localStorage.removeItem('therum_token');
          }
        } catch {
          // safe placeholder run
        }
      }
    };
    checkUser();
  }, []);

  // Fetch bookmarks of user when logged in
  const fetchUserBookmarks = async () => {
    const token = localStorage.getItem('therum_token');
    if (!token) return;
    try {
      const res = await fetch('/api/users/bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json() as Game[];
        setBookmarkedIds(data.map(g => g.id));
      }
    } catch {
      // ignore
    }
  };

  // Hydrate games lists based on search, filter and page changes
  const fetchGames = async () => {
    setLoadingGames(true);
    try {
      // Build search params
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      selectedTags.forEach(t => params.append('tag', t));
      if (selectedEngine) params.append('engine', selectedEngine);
      if (selectedPlatform) params.append('platform', selectedPlatform);
      if (selectedStatus) params.append('status', selectedStatus);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', String(page));

      const res = await fetch(`/api/games?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setGames(data.games);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGames(false);
    }
  };

  // Trigger loading list when filter changes
  useEffect(() => {
    if (currentRoute === '/' || currentRoute === '/bookmarks') {
      fetchGames();
    }
  }, [search, selectedTags, selectedEngine, selectedPlatform, selectedStatus, sortBy, page, currentRoute]);

  // Handle single active game loading for detailed preview
  useEffect(() => {
    if (currentRoute === '/game' && activeSlug) {
      const fetchGameDetail = async () => {
        setLoadingActiveGame(true);
        try {
          const res = await fetch(`/api/games/${activeSlug}`);
          if (res.ok) {
            const gameDetails = await res.json();
            setActiveGame(gameDetails);
          } else {
            setActiveGame(null);
          }
        } catch {
          setActiveGame(null);
        } finally {
          setLoadingActiveGame(false);
        }
      };
      fetchGameDetail();
    } else {
      setActiveGame(null);
    }
  }, [currentRoute, activeSlug]);

  const handleNavigate = (route: string) => {
    if (route === '/') {
      window.location.hash = '#/';
    } else if (route === '/admin') {
      window.location.hash = '#/admin';
    } else if (route === '/requests') {
      window.location.hash = '#/requests';
    } else if (route === '/bookmarks') {
      window.location.hash = '#/bookmarks';
    } else if (route.startsWith('/game/')) {
      window.location.hash = `#${route}`;
    }
  };

  const handleLoginSuccess = (userData: any, token: string) => {
    setUser(userData);
    localStorage.setItem('therum_token', token);
    fetchUserBookmarks();
  };

  const handleLogout = () => {
    setUser(null);
    setBookmarkedIds([]);
    localStorage.removeItem('therum_token');
    handleNavigate('/');
  };

  // Toggle bookmark on server side
  const handleBookmarkToggle = async (gameId: string): Promise<boolean> => {
    const token = localStorage.getItem('therum_token');
    if (!token) return false;
    try {
      const res = await fetch(`/api/games/${gameId}/bookmark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        fetchUserBookmarks();
        return data.bookmarked;
      }
    } catch {
      // safe offline toggle
    }
    return false;
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setPage(1);
  };

  const handleResetFilters = () => {
    setSelectedTags([]);
    setSelectedEngine('');
    setSelectedPlatform('');
    setSelectedStatus('');
    setSearch('');
    setSortBy('newest_updated');
    setPage(1);
  };

  return (
    <div id="therum-app" className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-sans transition-all selection:bg-emerald-500/20 selection:text-emerald-400 relative overflow-hidden">
      
      {/* Background Mesh Decor */}
      <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[150px] rounded-full"></div>
      </div>

      {/* Header bar and Auth triggers */}
      <Header 
        user={user}
        onNavigate={handleNavigate}
        currentRoute={currentRoute}
        onLogout={handleLogout}
        onTriggerLogin={() => setIsAuthOpen(true)}
        searchTerm={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
      />

      {/* Body content wraps */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col">
        <AnimatePresence mode="wait">
          
          {/* 1. Trang Chủ / Khám Phá: Sidebar list */}
          {currentRoute === '/' && (
            <motion.div 
              key="discover"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col lg:flex-row gap-8"
            >
              
              {/* Left filter side */}
              <SidebarFilter 
                selectedTags={selectedTags}
                onToggleTag={handleToggleTag}
                selectedEngine={selectedEngine}
                onSelectEngine={(e) => { setSelectedEngine(e); setPage(1); }}
                selectedPlatform={selectedPlatform}
                onSelectPlatform={(p) => { setSelectedPlatform(p); setPage(1); }}
                selectedStatus={selectedStatus}
                onSelectStatus={(s) => { setSelectedStatus(s); setPage(1); }}
                onResetFilters={handleResetFilters}
                genres={filterConfig.genres.length > 0 ? filterConfig.genres : undefined}
                engines={filterConfig.engines.length > 0 ? filterConfig.engines : undefined}
                platforms={filterConfig.platforms.length > 0 ? filterConfig.platforms : undefined}
              />

              {/* Right games list content area */}
              <div className="flex-1 space-y-6">
                
                {/* Visual Novel Discover Intro Banner */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                  {/* Banner backdrop subtle lights */}
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/20 via-zinc-900/40 to-blue-950/10 pointer-events-none" />
                  <div className="space-y-2 text-center md:text-left relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>TheRum Exclusive Việt Hóa</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Cổng Chia Sẻ Visual Novel Tuyệt Phẩm</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 font-medium max-w-lg leading-relaxed">
                      Kho tàng game nhập vai cốt truyện sâu, tiểu thuyết hình ảnh lãng mạn lôi cuốn được biên dịch hoàn chỉnh sang tiếng Việt thuần khiết.
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch gap-2.5 shrink-0 relative z-10 w-full sm:w-[160px]">
                    <div className="flex shrink-0 gap-3 border border-white/5 bg-zinc-900/80 p-1.5 rounded-2xl sm:p-2 backdrop-blur-sm shadow-lg w-full justify-around">
                      <div className="text-center px-3.5 border-r border-white/5 flex-1">
                        <strong className="text-lg text-emerald-400 font-mono font-bold">100%</strong>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Chất lượng</p>
                      </div>
                      <div className="text-center px-2 flex-1">
                        <strong className="text-lg text-white font-mono font-bold">Free</strong>
                        <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Không Ads</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      id="donate-btn"
                      onClick={() => setIsDonateOpen(true)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/15 cursor-pointer hover:scale-[1.02] active:scale-[0.98] select-none"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current text-slate-950 animate-pulse" />
                      <span>Donate Ủng Hộ</span>
                    </button>
                  </div>
                </div>

                {/* Sắp xếp dropdown & Header metrics */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-2 border-b border-white/5">
                  <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
                    Hiển thị <strong className="text-emerald-400 font-bold">{pagination.totalCount}</strong> tựa game phù hợp
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-550 font-medium shrink-0">Xếp theo:</span>
                    <div className="relative shrink-0 select-none z-30">
                      <button
                        type="button"
                        id="sort-select-btn"
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center justify-between gap-2 text-xs font-semibold px-3.5 py-1.5 bg-zinc-800/50 hover:bg-zinc-800/80 hover:text-white border border-white/10 focus:border-emerald-500/50 rounded-xl outline-none text-zinc-300 backdrop-blur-sm transition-all shadow-sm cursor-pointer"
                      >
                        <span>{SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isSortOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isSortOpen && (
                          <>
                            {/* Backdrop shield for click outside */}
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsSortOpen(false)} 
                            />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 mt-1.5 w-52 py-1 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 origin-top-right"
                            >
                              {SORT_OPTIONS.map((opt) => {
                                const isSelected = opt.value === sortBy;
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      setSortBy(opt.value);
                                      setPage(1);
                                      setIsSortOpen(false);
                                    }}
                                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium font-sans flex items-center justify-between transition-all cursor-pointer ${
                                      isSelected 
                                        ? 'bg-emerald-500/10 text-emerald-400 font-bold border-l-2 border-emerald-500' 
                                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white border-l-2 border-transparent'
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {isSelected && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    )}
                                  </button>
                                );
                              })}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* List Games grid rendering */}
                {loadingGames ? (
                  <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-xs text-slate-500 font-mono">Đang quét kho tàng game Visual Novel TheRum...</p>
                  </div>
                ) : games.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-6 text-center">
                    <RotateCcw className="w-10 h-10 text-zinc-500 mb-3" />
                    <h3 className="text-sm font-bold text-zinc-300">Không tìm thấy tựa game thích hợp</h3>
                    <p className="text-xs text-zinc-500 max-w-xs leading-relaxed mt-1">
                      Hãy thử nới lỏng hoặc loại bỏ bớt các bộ lọc, tag thể loại phía bên trái để mở rộng phạm vi tìm kiếm.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl transition-all uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {games.map(game => (
                      <GameCard 
                        key={game.id} 
                        game={game} 
                        onSelect={(slug) => handleNavigate(`/game/${slug}`)} 
                      />
                    ))}
                  </div>
                )}

                {/* Pagination actions footer */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-white/5">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className="p-2 border border-white/10 bg-zinc-900/40 hover:bg-zinc-800/60 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-zinc-400 font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Trước</span>
                    </button>
                    
                    <span className="text-xs font-mono font-black text-zinc-400">
                      Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                      className="p-2 border border-white/10 bg-zinc-900/40 hover:bg-zinc-800/60 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg text-zinc-400 font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1 shrink-0 transition-colors"
                    >
                      <span>Sau</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* 2. Trang Chi Tiết: GameDetail views */}
          {currentRoute === '/game' && (
            <motion.div 
              key="game-detail"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {loadingActiveGame ? (
                <div className="flex flex-col items-center justify-center py-40 gap-3">
                  <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500 font-mono">Đang đọc chi tiết hồ sơ tệp game...</p>
                </div>
              ) : activeGame ? (
                <GameDetail 
                  game={activeGame}
                  user={user}
                  onBack={() => handleNavigate('/')}
                  onBookmarkToggle={handleBookmarkToggle}
                  isBookmarked={bookmarkedIds.includes(activeGame.id)}
                  onTriggerLogin={() => setIsAuthOpen(true)}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-slate-500 font-bold text-sm">Hồ sơ game này không tồn tại hoặc đã bị ẩn.</p>
                  <button onClick={() => handleNavigate('/')} className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer">
                    Trở lại sảnh
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. Trang Quản Trị: Admin space */}
          {currentRoute === '/admin' && (
            <motion.div 
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {user?.role === 'admin' || user?.role === 'dichgia' ? (
                <AdminDashboard 
                  currentUser={user}
                  onRefreshedGames={() => { fetchGames(); fetchConfig(); }}
                  gamesList={games}
                  onSelectGame={(slug) => handleNavigate(`/game/${slug}`)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-28 text-center bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                  <Lock className="w-12 h-12 text-red-500 mb-3" />
                  <h3 className="text-base font-bold text-zinc-200">Khu vực hạn chế quyền truy cập</h3>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
                    Trang này có tính bảo mật cao, chỉ dành riêng cho biên dịch viên có thẩm quyền Admin của thương hiệu TheRum để đăng tải game.
                  </p>
                  {!user && (
                    <button 
                      onClick={() => setIsAuthOpen(true)} 
                      className="mt-4 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-emerald-500/15"
                    >
                      Đăng Nhập Admin
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* 4. Trang Bookmarks / Thư viện đã lưu */}
          {currentRoute === '/bookmarks' && (
            <motion.div 
              key="bookmarks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <BookMarked className="w-6 h-6 text-emerald-400" />
                <h2 className="text-lg font-black font-sans text-slate-100 uppercase tracking-widest">Bộ Sưu Tập Game Đã Lưu</h2>
              </div>

              {bookmarkedIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-6 text-center">
                  <Compass className="w-10 h-10 text-zinc-500 mb-3" />
                  <h3 className="text-sm font-bold text-zinc-350">Thư viện rỗng</h3>
                  <p className="text-xs text-zinc-500 max-w-xs mt-1">
                    Hãy bấm nút Yêu Thích (Bookmark) ở trang chi tiết của bất kỳ game nào để đưa vào bộ sưu tập cá nhân dễ tìm lại.
                  </p>
                  <button onClick={() => handleNavigate('/')} className="mt-4 px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer shadow-md shadow-emerald-500/15">
                    Khám phá ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {games.filter(g => bookmarkedIds.includes(g.id)).map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onSelect={(slug) => handleNavigate(`/game/${slug}`)} 
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* 5. Trang Yêu cầu dịch game */}
          {currentRoute === '/requests' && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <GameRequests 
                user={user}
                onTriggerLogin={() => setIsAuthOpen(true)}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-white/5 bg-zinc-950/40 py-8 text-center text-xs text-zinc-500 relative z-10 shrink-0 font-sans mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <p className="text-zinc-400 font-semibold text-xs font-sans">
            Thương hiệu Visual Novel Việt ngữ <span className="text-emerald-400">TheRum</span> — Đồng hành cùng đam mê.
          </p>
          <p className="max-w-md mx-auto leading-relaxed text-[11px] text-zinc-600">
            Mục tiêu cung cấp các bản dịch chất lượng cao, an toàn sạch sẽ, hoàn hảo vì niềm vui thưởng thức game nguyên bản của gamer Việt.
          </p>
          <div className="w-full h-px bg-white/5 my-3" />
          <p className="font-mono text-[10px] text-zinc-700">
            &copy; {new Date().getFullYear()} TheRum. Bản quyền tệp game thuộc về nhà phát hành gốc tương ứng.
          </p>
        </div>
      </footer>

      {/* Global Auth Modal portal */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Global Donate Modal portal */}
      <DonateModal 
        isOpen={isDonateOpen}
        onClose={() => setIsDonateOpen(false)}
      />

      {/* Age Verification Overlay */}
      <AnimatePresence>
        {!isAgeConfirmed && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999]"
          >
            <AgeVerification onConfirm={handleConfirmAge} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
