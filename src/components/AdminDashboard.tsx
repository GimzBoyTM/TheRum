import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit, Trash2, CheckCircle2, AlertOctagon, LayoutDashboard, 
  Settings, Key, Trash, Link, Globe, AlertCircle, Sparkles, FolderPlus, Compass,
  Database, Download, Upload
} from 'lucide-react';
import { Game, BrokenReport, User, GameRequest } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

interface AdminDashboardProps {
  currentUser: User | null;
  onRefreshedGames: () => void;
  gamesList: Game[];
  onSelectGame: (slug: string) => void;
}

export default function AdminDashboard({ currentUser, onRefreshedGames, gamesList, onSelectGame }: AdminDashboardProps) {
  const displayGames = currentUser?.role === 'admin'
    ? gamesList
    : gamesList.filter(game => game.uploaderId === currentUser?.id);

  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'add' | 'edit' | 'reports' | 'config' | 'users' | 'database'>('stats');
  const [reports, setReports] = useState<BrokenReport[]>([]);
  const [requestsList, setRequestsList] = useState<GameRequest[]>([]);
  const [stats, setStats] = useState({ totalGames: 0, totalUsers: 0, pendingReports: 0, pendingRequests: 0, totalDownloads: 0 });

  // User Management states
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserRole, setEditingUserRole] = useState<'user' | 'admin' | 'dichgia' | 'vip'>('user');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserName, setDeletingUserName] = useState<string>('');

  const fetchUsersList = async () => {
    if (currentUser?.role !== 'admin') return;
    setLoadingUsers(true);
    setUserActionError('');
    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      } else {
        const err = await res.json();
        setUserActionError(err.error || 'Không thể lấy dữ liệu danh sách tài khoản');
      }
    } catch {
      setUserActionError('Lỗi kết nối máy chủ');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'user' | 'admin' | 'dichgia' | 'vip') => {
    setUserActionError('');
    setUserActionSuccess('');
    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setUserActionSuccess('Cập nhật phân quyền tài khoản thành công!');
        fetchUsersList();
        setEditingUserId(null);
      } else {
        const err = await res.json();
        setUserActionError(err.error || 'Có lỗi xảy ra khi chỉnh sửa vai trò');
      }
    } catch {
      setUserActionError('Lỗi kết nối máy chủ không phản hồi');
    }
  };

  const handleResetUserPassword = async (userId: string) => {
    setUserActionError('');
    setUserActionSuccess('');
    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserActionSuccess('Khôi phục mật khẩu thành công! Mật khẩu mới là: user123');
      } else {
        const err = await res.json();
        setUserActionError(err.error || 'Có lỗi xảy ra khi khôi phục mật khẩu');
      }
    } catch {
      setUserActionError('Lỗi kết nối máy chủ không phản hồi');
    }
  };

  const handleDeleteUserAccount = async (userId: string) => {
    setUserActionError('');
    setUserActionSuccess('');
    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setUserActionSuccess('Đã xóa tài khoản ra khỏi hệ thống vĩnh viễn!');
        fetchUsersList();
        setDeletingUserId(null);
      } else {
        const err = await res.json();
        setUserActionError(err.error || 'Không thể xóa tài khoản này');
      }
    } catch {
      setUserActionError('Lỗi kết nối máy chủ không phản hồi');
    }
  };

  // Safe non-blocking delete dialog states (replaces iframe-sandboxed window.confirm)
  const [deletingGameId, setDeletingGameId] = useState<string | null>(null);
  const [deletingGameTitle, setDeletingGameTitle] = useState<string>('');

  const [dbConfig, setDbConfig] = useState<{ genres: string[]; engines: string[]; platforms: string[] }>({
    genres: [],
    engines: [],
    platforms: []
  });

  const fetchDbConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setDbConfig(data);
      }
    } catch (err) {
      console.error("Error fetching admin filter config:", err);
    }
  };

  // For Editing Game
  const [selectedGameToEdit, setSelectedGameToEdit] = useState<Game | null>(null);

  // Form states for Game Addition & Modification
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [developer, setDeveloper] = useState('');
  const [publisher, setPublisher] = useState('');
  const [status, setStatus] = useState('Hoàn thành');
  const [engine, setEngine] = useState('RenPy');
  const [platforms, setPlatforms] = useState<string[]>(['Windows']);
  const [ageRating, setAgeRating] = useState('16+');
  const [tags, setTags] = useState<string[]>(['Chương Trình Việt Hóa']);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [gameChangelogs, setGameChangelogs] = useState<{ version: string; date: string; content: string }[]>([]);
  const [newLogVersion, setNewLogVersion] = useState('');
  const [newLogContent, setNewLogContent] = useState('');
  const [downloadLinks, setDownloadLinks] = useState<{ label: string; url: string; password?: string; isVip?: boolean }[]>([
    { label: 'Google Drive', url: '' }
  ]);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById('game-description-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const before = text.substring(0, start);
    const after = text.substring(end);
    const selected = text.substring(start, end);

    let replacement = '';
    switch (syntax) {
      case 'bold':
        replacement = `**${selected || 'in_đậm'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'in_nghiêng'}*`;
        break;
      case 'h2':
        replacement = `\n## ${selected || 'Tiêu đề 2'}\n`;
        break;
      case 'h3':
        replacement = `\n### ${selected || 'Tiêu đề 3'}\n`;
        break;
      case 'list':
        replacement = `\n- ${selected || 'Mục danh sách'}\n`;
        break;
      case 'numlist':
        replacement = `\n1. ${selected || 'Mục số'}\n`;
        break;
      case 'link':
        replacement = `[${selected || 'Tên liên kết'}](https://)`;
        break;
      case 'quote':
        replacement = `\n> ${selected || 'Trích dẫn'}\n`;
        break;
      default:
        break;
    }

    setDescription(before + replacement + after);

    // Refocus & select inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Fetch admin states and report issues
  const token = localStorage.getItem('therum_token');

  const fetchAdminData = async () => {
    try {
      await fetchDbConfig();

      // Fetch requested games list for upvote bar chart stats
      try {
        const requestsRes = await fetch('/api/requests');
        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRequestsList(requestsData);
        }
      } catch (err) {
        console.error("Error fetching requests for chart:", err);
      }

      if (currentUser?.role !== 'admin') {
        return;
      }
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData) setStats(statsData);
      }

      const reportsRes = await fetch('/api/admin/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData);
      }
    } catch {
      // safe fallback for standalone run
    }
  };

  useEffect(() => {
    fetchAdminData();
    if (activeSubTab === 'users' && currentUser?.role === 'admin') {
      fetchUsersList();
    }
  }, [activeSubTab, currentUser]);

  // Handle dynamic download links form
  const handleAddLink = () => {
    setDownloadLinks([...downloadLinks, { label: 'Google Drive', url: '' }]);
  };

  const handleRemoveLink = (idx: number) => {
    const updated = [...downloadLinks];
    updated.splice(idx, 1);
    setDownloadLinks(updated);
  };

  const handleLinkChange = (idx: number, field: string, value: any) => {
    const updated = [...downloadLinks] as any;
    updated[idx][field] = value;
    setDownloadLinks(updated);
  };

  const handlePlatformCheckbox = (plat: string) => {
    if (platforms.includes(plat)) {
      setPlatforms(platforms.filter(p => p !== plat));
    } else {
      setPlatforms([...platforms, plat]);
    }
  };

  const handleTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  // Pre-fill form when choosing a game to edit
  const triggerEditGame = (game: Game) => {
    setSelectedGameToEdit(game);
    setTitle(game.title);
    setShortDescription(game.shortDescription);
    setDescription(game.description);
    setCoverUrl(game.coverUrl);
    setBannerUrl(game.bannerUrl);
    setDeveloper(game.developer);
    setPublisher(game.publisher);
    setStatus(game.status);
    setEngine(game.engine);
    setPlatforms(game.platforms);
    setAgeRating(game.ageRating);
    setTags(game.tags);
    setDownloadLinks(game.downloadLinks);
    setScreenshots(game.screenshots || []);
    setGameChangelogs(game.changelogs || []);
    setNewLogVersion('');
    setNewLogContent('');
    setActiveSubTab('edit');
    setFormError('');
    setFormSuccess('');
  };

  const resetFormFields = () => {
    setTitle('');
    setShortDescription('');
    setDescription('');
    setCoverUrl('');
    setBannerUrl('');
    setDeveloper('');
    setPublisher('');
    setStatus('Hoàn thành');
    setEngine('RenPy');
    setPlatforms(['Windows']);
    setAgeRating('16+');
    setTags(['Chương Trình Việt Hóa']);
    setScreenshots([]);
    setGameChangelogs([]);
    setNewLogVersion('');
    setNewLogContent('');
    setDownloadLinks([{ label: 'Google Drive', url: '' }]);
    setSelectedGameToEdit(null);
  };

  const handleGameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmittingForm(true);

    if (getValidLinks().length === 0) {
      setFormError('Vui lòng điền ít nhất 1 liên kết tải về hợp lệ');
      setSubmittingForm(false);
      return;
    }

    const validScreenshots = screenshots.filter(s => s.trim() !== '');

    // Accumulate the history logs, appending any new update log entered
    let finalChangelogs = [...gameChangelogs];
    if (newLogContent.trim()) {
      finalChangelogs.unshift({
        version: newLogVersion.trim() || `Bản vá - ${new Date().toLocaleDateString('vi-VN')}`,
        date: new Date().toISOString().split('T')[0],
        content: newLogContent.trim()
      });
    }

    const payload = {
      title,
      shortDescription,
      description,
      coverUrl,
      bannerUrl,
      developer,
      publisher,
      status,
      engine,
      platforms,
      ageRating,
      tags,
      screenshots: validScreenshots.length > 0 ? validScreenshots : [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&h=450&q=80'
      ],
      changelogs: finalChangelogs,
      downloadLinks: getValidLinks()
    };

    const url = selectedGameToEdit ? `/api/games/${selectedGameToEdit.id}` : '/api/games';
    const method = selectedGameToEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Xử lý thất bại');
      }

      setFormSuccess(selectedGameToEdit ? 'Đã chỉnh sửa game thành công!' : 'Đã đăng game mới thành công lên TheRum!');
      resetFormFields();
      onRefreshedGames();
      setTimeout(() => {
        setActiveSubTab('stats');
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi hệ thống');
    } finally {
      setSubmittingForm(false);
    }
  };

  const executeDelete = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshedGames();
        fetchAdminData();
        if (selectedGameToEdit && selectedGameToEdit.id === gameId) {
          resetFormFields();
          setActiveSubTab('stats');
        }
        setFormSuccess('Gỡ bỏ trò chơi thành công ra khỏi hệ thống TheRum!');
        setTimeout(() => setFormSuccess(''), 4000);
      } else {
        const err = await res.json();
        setFormError(err.error || 'Không thể xóa trò chơi này.');
        setTimeout(() => setFormError(''), 4000);
      }
    } catch {
      setFormError('Lỗi kết nối máy chủ khi thực hiện xóa.');
      setTimeout(() => setFormError(''), 4000);
    }
  };

  const resolveReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchAdminData();
      }
    } catch {
      // safe fallback
    }
  };

  const DEFAULT_GENRES = [
    'Romance', 'Drama', 'Slice of Life', 'Action', 'Fantasy', 'Mystery', 
    'Sci-Fi', 'Psychological', 'Thriller', 'Gothic', 'Tragedy', 'Horror', 'School Life'
  ];
  const DEFAULT_ENGINES = ['RenPy', 'KiriKiri', 'Unity', 'RPG Maker', 'TyranoBuilder'];
  const DEFAULT_PLATFORMS = ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5'];

  const handleSaveConfig = async () => {
    setSubmittingForm(true);
    setFormError('');
    setFormSuccess('');
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          genres: dbConfig.genres.length > 0 ? dbConfig.genres : DEFAULT_GENRES,
          engines: dbConfig.engines.length > 0 ? dbConfig.engines : DEFAULT_ENGINES,
          platforms: dbConfig.platforms.length > 0 ? dbConfig.platforms : DEFAULT_PLATFORMS
        })
      });

      if (res.ok) {
        setFormSuccess('Lưu thay đổi cấu hình bộ lọc thành công!');
        fetchDbConfig();
        onRefreshedGames();
      } else {
        const data = await res.json();
        setFormError(data.error || 'Đã xảy ra lỗi khi lưu cấu hình.');
      }
    } catch (err) {
      setFormError('Lỗi kết nối máy chủ.');
    } finally {
      setSubmittingForm(false);
    }
  };

  const getValidLinks = () => {
    return downloadLinks.filter(l => l.url.trim() !== '');
  };

  const ALL_GENRES_OPTIONS = dbConfig.genres.length > 0 ? dbConfig.genres : DEFAULT_GENRES;

  const COMMON_TAGS_OPTIONS = ['Chương Trình Việt Hóa', 'Đặc Sắc', 'Hoàn Thành'];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard className="w-6 h-6 text-emerald-400" />
        <h2 className="text-xl font-bold font-sans text-slate-100 uppercase tracking-wide">
          {currentUser?.role === 'admin' ? 'Hệ Thống Quản Trị Viên Visual Novel' : 'Không Gian Biên Dịch & Đăng Tải Game'}
        </h2>
      </div>

      {/* Admin tabs */}
      <div className="flex flex-wrap border-b border-white/5 bg-zinc-900/40 backdrop-blur-sm p-1 rounded-xl gap-1">
        <button
          onClick={() => setActiveSubTab('stats')}
          className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          {currentUser?.role === 'admin' ? 'Thống kê & Danh sách game' : 'Danh sách game đã đăng'}
        </button>
        <button
          onClick={() => {
            resetFormFields();
            setActiveSubTab('add');
          }}
          className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeSubTab === 'add'
              ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Đăng Game Việt Hóa mới</span>
        </button>
        
        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
                activeSubTab === 'reports'
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <span>Báo sập link / Lỗi liên kết</span>
              {stats.pendingReports > 0 && (
                <span className="absolute -top-1 right-2 bg-red-500 text-zinc-950 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {stats.pendingReports}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('config')}
              className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'config'
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4 text-emerald-400" />
              <span>QL Bộ lọc & Thể loại</span>
            </button>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4 text-amber-500" />
              <span>Quản lý Tài khoản (Phân quyền)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('database')}
              className={`flex-1 min-w-[125px] py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'database'
                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/20'
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sao lưu & Khôi phục</span>
            </button>
          </>
        )}
      </div>

      {/* SUB-TAB CONTENTS */}
      {activeSubTab === 'stats' && (
        <div className="space-y-6">
          
          {/* Statistics grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            
            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm shadow-md">
              <span className="text-[10px] text-zinc-500 block uppercase font-mono font-bold tracking-wider">Tổng số game</span>
              <strong className="text-2xl text-white font-mono mt-1 block">{stats.totalGames}</strong>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm shadow-md">
              <span className="text-[10px] text-zinc-500 block uppercase font-mono font-bold tracking-wider">Lượt tải về</span>
              <strong className="text-2xl text-emerald-400 font-mono mt-1 block">{stats.totalDownloads}</strong>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm shadow-md">
              <span className="text-[10px] text-zinc-500 block uppercase font-mono font-bold tracking-wider">Người thành viên</span>
              <strong className="text-2xl text-white font-mono mt-1 block">{stats.totalUsers}</strong>
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm shadow-md flex justify-between items-center bg-transparent">
              <div>
                <span className="text-[10px] text-red-400 block uppercase font-mono font-bold tracking-wider">Báo cáo link hỏng</span>
                <strong className={`text-2xl font-mono mt-1 block ${stats.pendingReports > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`}>
                  {stats.pendingReports}
                </strong>
              </div>
              {stats.pendingReports > 0 && <AlertOctagon className="w-5 h-5 text-red-500" />}
            </div>

            <div className="p-4 rounded-xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm shadow-md flex justify-between items-center bg-transparent col-span-2 md:col-span-1">
              <div>
                <span className="text-[10px] text-amber-400 block uppercase font-mono font-bold tracking-wider">Đề xuất chờ duyệt</span>
                <strong className={`text-2xl font-mono mt-1 block ${stats.pendingRequests > 0 ? 'text-amber-500 animate-pulse' : 'text-zinc-400'}`}>
                  {stats.pendingRequests || 0}
                </strong>
              </div>
            </div>

          </div>

          {/* Recharts Requested Games Votes Visualization */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Left: Beautiful Bar Chart of votes */}
            <div className="lg:col-span-2 border border-white/5 bg-zinc-900/40 backdrop-blur-md p-5 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-sans">Top 10 Game Đang Được Yêu Cầu Nhiều Nhất</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Trực quan hóa số lượng bình chọn tích lũy từ phiếu bầu thành viên</p>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-mono leading-none">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Cập nhật trực tiếp</span>
                </div>
              </div>

              {requestsList.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-xs text-zinc-500 font-mono italic">
                  Chưa có dữ liệu tựa game yêu cầu bình chọn nào.
                </div>
              ) : (
                <div className="w-[101%] -ml-1">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[...requestsList]
                        .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
                        .slice(0, 10)
                        .map(req => ({
                          name: req.title.length > 20 ? req.title.substring(0, 20) + '...' : req.title,
                          fullName: req.title,
                          votes: req.votes?.length || 0,
                          status: req.status
                        }))}
                      margin={{ top: 15, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis 
                        dataKey="name" 
                        stroke="#71717a" 
                        fontSize={9.5}
                        tickLine={false}
                        axisLine={false}
                        dy={5}
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-950/95 border border-white/10 p-3 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-sm max-w-[280px]">
                                <p className="font-bold text-slate-100 leading-normal">{payload[0].payload.fullName}</p>
                                <p className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                                  <span>Lượt bình chọn:</span>
                                  <strong className="font-extrabold text-sm">{payload[0].value} phiếu</strong>
                                </p>
                                <p className="text-[10px] text-zinc-500 font-medium">Trạng thái dịch: {payload[0].payload.status}</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar dataKey="votes" radius={[5, 5, 0, 0]}>
                        {[...requestsList]
                          .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
                          .slice(0, 10)
                          .map((entry, index) => {
                            let barColor = '#34d399';
                            if (index === 0) barColor = '#10b981';
                            else if (index === 1) barColor = '#059669';
                            return <Cell key={`cell-${index}`} fill={barColor} className="transition-all hover:opacity-100 duration-200" style={{ cursor: 'pointer' }} />;
                          })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Right: Small structured ranking list table */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 rounded-2xl shadow-md space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-sans">Bảng xếp hạng bình chọn</h3>
                <p className="text-[10px] text-zinc-550">Chi tiết thống kê số phiếu của các dự án được mong đợi nhất</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] custom-scrollbar pr-1 divide-y divide-white/5">
                {[...requestsList]
                  .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
                  .slice(0, 5)
                  .map((req, idx) => {
                    const upvotesCount = req.votes?.length || 0;
                    return (
                      <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 group hover:bg-white/[0.01] px-1 rounded transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black shrink-0 ${
                            idx === 0 ? 'bg-amber-500 text-black' :
                            idx === 1 ? 'bg-slate-300 text-black' :
                            idx === 2 ? 'bg-amber-700 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs text-slate-200 truncate font-semibold font-sans">{req.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10">
                            {upvotesCount} phiếu
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {requestsList.length === 0 && (
                  <div className="text-center py-12 text-[10px] text-zinc-500 italic">Không có đề xuất nào</div>
                )}
              </div>

              <div className="pt-3 border-t border-white/5 text-[10px] text-zinc-500 flex items-center justify-between font-mono">
                <span>Tổng số đề cử:</span>
                <span className="font-bold text-slate-300">{requestsList.length} trò chơi</span>
              </div>
            </div>
          </div>

          {/* Table list of all games in the system */}
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-md">
            <div className="p-4 border-b border-white/5 font-bold font-sans text-xs text-zinc-400 uppercase tracking-widest">
              Danh sách quản lý tệp game
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-white/5">
                <thead className="bg-zinc-950/40 text-zinc-500 uppercase font-mono">
                  <tr>
                    <th className="p-4 font-bold">Hình bìa / Tên game VN</th>
                    <th className="p-4 font-bold">Engine / OS</th>
                    <th className="p-4 font-bold">Trạng thái</th>
                    <th className="p-4 font-bold">Lượt Tải</th>
                    <th className="p-4 font-bold text-right">Điều khiển</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  {displayGames.map(game => (
                    <tr key={game.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 flex items-center gap-3 min-w-[300px]">
                        <img 
                          src={game.coverUrl} 
                          alt={game.title} 
                          className="w-8 h-12 rounded object-cover border border-slate-900 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-200 truncate">{game.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">slug: {game.slug}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-slate-400">{game.engine}</p>
                        <p className="text-[10px] text-slate-500 font-sans">{game.platforms.join(', ')}</p>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          game.status === 'Hoàn thành' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/20' : 'bg-blue-950/40 text-blue-400 border-blue-900/20'
                        }`}>
                          {game.status}
                        </span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-400">
                        {game.downloadsCount}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectGame(game.slug)}
                            className="p-1 px-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-300 font-semibold rounded text-[10px] transition-colors cursor-pointer"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => triggerEditGame(game)}
                            className="p-1 text-slate-400 hover:text-emerald-400 border border-transparent hover:border-slate-800 rounded transition-all cursor-pointer"
                            title="Sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            id={`delete-btn-${game.id}`}
                            onClick={() => {
                              setDeletingGameId(game.id);
                              setDeletingGameTitle(game.title);
                            }}
                            className="p-1 text-slate-400 hover:text-red-400 border border-transparent hover:border-slate-800 rounded transition-all cursor-pointer"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB CONTENTS: Form Add / Edit */}
      {(activeSubTab === 'add' || activeSubTab === 'edit') && (
        <form onSubmit={handleGameSubmit} className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-6 space-y-6 shadow-md">
          
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-zinc-100 font-sans">
              {selectedGameToEdit ? `Đang chỉnh sửa: ${selectedGameToEdit.title}` : 'Đăng tải Hồ sơ Visual Novel mới'}
            </h3>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 text-red-200 text-xs rounded-lg">
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-900/40 text-emerald-200 text-xs rounded-lg">
              {formSuccess}
            </div>
          )}

          {/* Form grid row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Tiêu Đề Game</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Doki Doki Literature Club!"
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Mô Tả Ngắn (Hiển thị đầu trang / card)</label>
              <input
                type="text"
                required
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Kể ngắn dòng 1-2 câu tóm tắt nội dung cốt lõi..."
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              />
            </div>

          </div>

          {/* Form grid row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Hãng phát triển (Developer)</label>
              <input
                type="text"
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                placeholder="Ví dụ: Key, Sphere, Nitroplus..."
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Độ tuối Rating</label>
              <select
                value={ageRating}
                onChange={(e) => setAgeRating(e.target.value)}
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs text-slate-300"
              >
                <option value="G">Mọi lứa tuổi (G)</option>
                <option value="12+">Trung học cơ sở (12+)</option>
                <option value="15+">Theo dõi tâm lý (15+)</option>
                <option value="16+">Nhận thức cao (16+)</option>
                <option value="18+">Người lớn nhạy cảm (18+)</option>
              </select>
            </div>

          </div>

          {/* Form grid row 3: URLs Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">URL Ảnh Bìa (Cover Art 2:3 ratio)</label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="Nhập URL ảnh liên kết hoặc bỏ trống để gán tự động..."
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">URL Banner lớn (Landscape ratio)</label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="Nhập URL ảnh bìa rộng đầu sảnh..."
                className="w-full p-2.5 bg-slate-900/80 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              />
            </div>

          </div>

          {/* Form grid row 4: Status / Engine */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Trạng Thái Dịch</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              >
                <option value="Hoàn thành">Hoàn thành (Đầy đủ 100%)</option>
                <option value="Đang dịch">Đang dịch (Đang xử lý tiếp)</option>
                <option value="Tạm ngưng">Tạm ngưng (Đóng băng tạm thời)</option>
                <option value="Demo">Demo (Bản chơi thử ngắn)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Game Engine hỗ trợ</label>
              <select
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                className="w-full p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 focus:border-emerald-500 rounded-xl outline-none text-slate-200 text-xs"
              >
                {(dbConfig.engines.length > 0 ? dbConfig.engines : DEFAULT_ENGINES).map(eng => (
                  <option key={eng} value={eng}>{eng === 'RenPy' ? "Ren'Py" : eng}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Multi checkboxes for Platforms */}
          <div className="space-y-2 border border-slate-900 bg-slate-900/20 p-4 rounded-xl">
            <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Hỗ trợ các Hệ Điều Hành</label>
            <div className="flex flex-wrap gap-4">
              {(dbConfig.platforms.length > 0 ? dbConfig.platforms : DEFAULT_PLATFORMS).map(plat => (
                <label key={plat} className="flex items-center gap-1.5 text-xs text-slate-300 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={platforms.includes(plat)}
                    onChange={() => handlePlatformCheckbox(plat)}
                    className="accent-emerald-500"
                  />
                  <span>{plat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Genre & Features Tag Checkboxes */}
          <div className="space-y-3.5 border border-slate-900 bg-slate-900/20 p-4 rounded-xl">
            <div>
              <label className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider block">Chọn Tag Thể Loại Visual Novel</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ALL_GENRES_OPTIONS.map(g => {
                  const active = tags.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleTagToggle(g)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        active 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                          : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Phân loại nâng cao</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_TAGS_OPTIONS.map(g => {
                  const active = tags.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleTagToggle(g)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        active 
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' 
                          : 'bg-slate-950 text-slate-500 border-slate-850 hover:text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description Detailed: MARKDOWN */}
          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">Mô tả đầy đủ chi tiết (Hỗ trợ Markdown)</label>
              
              {/* Quick Markdown Toolbar */}
              <div className="flex flex-wrap items-center gap-1 bg-zinc-950/40 p-1 border border-white/5 rounded-lg select-none">
                <button
                  type="button"
                  title="In đậm (Bold)"
                  onClick={() => insertMarkdown('bold')}
                  className="px-2 py-1 text-[10.5px] font-extrabold text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-sans"
                >
                  B
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                  type="button"
                  title="In nghiêng (Italic)"
                  onClick={() => insertMarkdown('italic')}
                  className="px-2 py-1 text-[10.5px] italic text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-sans"
                >
                  I
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                  type="button"
                  title="Tiêu đề 2 (##)"
                  onClick={() => insertMarkdown('h2')}
                  className="px-1.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-mono"
                >
                  H2
                </button>
                <button
                  type="button"
                  title="Tiêu đề 3 (###)"
                  onClick={() => insertMarkdown('h3')}
                  className="px-1.5 py-1 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-mono"
                >
                  H3
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                  type="button"
                  title="Danh sách gạch đầu dòng"
                  onClick={() => insertMarkdown('list')}
                  className="px-1.5 py-1 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-sans"
                >
                  • Danh sách
                </button>
                <button
                  type="button"
                  title="Danh sách số"
                  onClick={() => insertMarkdown('numlist')}
                  className="px-1.5 py-1 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-sans"
                >
                  1. Số
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                  type="button"
                  title="Chèn liên kết"
                  onClick={() => insertMarkdown('link')}
                  className="px-1.5 py-1 text-[10.5px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-450/10 rounded transition-all cursor-pointer font-sans flex items-center gap-0.5"
                >
                  <Link className="w-3 h-3" />
                  <span>Link</span>
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button
                  type="button"
                  title="Trích dẫn"
                  onClick={() => insertMarkdown('quote')}
                  className="px-1.5 py-1 text-[10px] text-slate-300 hover:text-white hover:bg-white/5 rounded transition-all cursor-pointer font-sans"
                >
                  " Trích dẫn
                </button>
              </div>
            </div>
            <textarea
              id="game-description-textarea"
              required
              rows={12}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Viết tiểu sử, cốt truyện, tính năng, và thông báo lưu ý bằng cú pháp Markdown..."
              className="w-full p-3 bg-slate-900/80 border border-slate-800 focus:border-red-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl outline-none text-slate-200 text-xs leading-relaxed"
            />
            <p className="text-[9.5px] text-zinc-500 leading-normal">
              💡 Bạn có thể bôi đen chữ trước rồi nhấn các nút trợ giúp trên để thêm nhãn Markdown nhanh chóng. Định dạng sẽ hiển thị tại trang chi tiết trò chơi.
            </p>
          </div>

          {/* Dynamic Download links inputs */}
          <div className="space-y-4 border border-slate-900 bg-slate-900/20 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <label className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">Hộp Thư Liên Kết Tải Về</label>
              <button
                type="button"
                onClick={handleAddLink}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Thêm Link Tải</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {downloadLinks.map((link, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row items-center gap-2 border-b border-slate-900/40 pb-2.5 sm:border-0 sm:pb-0">
                  <div className="relative w-full sm:w-1/3">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-[10px] uppercase font-mono">Label</span>
                    <input
                      type="text"
                      required
                      value={link.label}
                      onChange={(e) => handleLinkChange(idx, 'label', e.target.value)}
                      placeholder="ví dụ: Google Drive (PC)"
                      className="w-full pl-12 pr-2 py-2 bg-slate-950 border border-slate-850 text-xs rounded-lg text-slate-300 outline-none"
                    />
                  </div>

                  <div className="relative w-full sm:flex-1">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <input
                      type={link.isVip ? "text" : "url"}
                      required
                      value={link.url}
                      onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                      placeholder="Nhập URL tải về..."
                      className="w-full pl-9 pr-2 py-2 bg-slate-950 border border-slate-850 text-xs rounded-lg text-slate-300 outline-none"
                    />
                  </div>

                  <div className="relative w-full sm:w-1/4">
                    <Key className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                    <input
                      type="text"
                      value={link.password || ''}
                      onChange={(e) => handleLinkChange(idx, 'password', e.target.value)}
                      placeholder="Mật khẩu giải nén..."
                      className="w-full pl-9 pr-2 py-2 bg-slate-950 border border-slate-850 text-xs rounded-lg text-slate-300 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 px-2 mt-2 sm:mt-0">
                    <input
                      type="checkbox"
                      id={`vip-link-${idx}`}
                      checked={link.isVip || false}
                      onChange={(e) => handleLinkChange(idx, 'isVip', e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-fuchsia-500 focus:ring-fuchsia-500 bg-slate-950 cursor-pointer accent-fuchsia-500"
                    />
                    <label htmlFor={`vip-link-${idx}`} className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest cursor-pointer select-none">
                      VIP
                    </label>
                  </div>

                  {downloadLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg shrink-0 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Screenshots Gallery Section */}
          <div className="space-y-3 border border-slate-900 bg-slate-905/20 p-4 rounded-xl">
            <div className="flex justify-between items-center bg-slate-950/20 pb-2 border-b border-slate-900">
              <div>
                <label className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider block">Thư viện ảnh trò chơi (Screenshots)</label>
                <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Nhập các liên kết hình ảnh mô tả trong game (hiển thị tại tab Thư viện ngoài trang chi tiết).</span>
              </div>
              <button
                type="button"
                onClick={() => setScreenshots([...screenshots, ''])}
                className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Ảnh vào Thư viện</span>
              </button>
            </div>

            {screenshots.length === 0 ? (
              <div className="text-center py-5 text-slate-500 text-xs bg-slate-950/25 rounded-lg border border-dashed border-slate-850">
                Chưa có ảnh nào được thêm vào thư viện trò chơi này. Hãy bấm nút "Thêm Ảnh" ở trên để tiếp tục.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 font-sans">
                {screenshots.map((screen, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-2 relative">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="text-[10.5px] font-mono font-bold text-slate-450 uppercase">Hình ảnh #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...screenshots];
                          updated.splice(idx, 1);
                          setScreenshots(updated);
                        }}
                        className="text-[10.5px] font-bold text-red-400 hover:text-red-300 flex items-center gap-0.5 uppercase tracking-widest cursor-pointer font-sans"
                        title="Xóa hình ảnh này"
                      >
                        <Trash className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                    <input
                      type="url"
                      required
                      value={screen}
                      onChange={(e) => {
                        const updated = [...screenshots];
                        updated[idx] = e.target.value;
                        setScreenshots(updated);
                      }}
                      placeholder="Nhập URL ảnh (ví dụ: https://example.com/image.jpg)"
                      className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg outline-none text-slate-200 text-xs"
                    />
                    {screen && screen.startsWith('http') && (
                      <div className="h-24 w-full overflow-hidden rounded-lg bg-black/40 border border-slate-900 relative flex items-center justify-center">
                        <img
                          src={screen}
                          alt={`Xem trước ảnh ${idx + 1}`}
                          className="h-full object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Changelogs Management Section */}
          <div className="space-y-4 border border-slate-900 bg-slate-905/20 p-4 rounded-xl">
            <div>
              <label className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider block">Tiến độ & Nhật ký cập nhật</label>
              <span className="text-[10px] text-slate-500 font-sans block mt-0.5">Mọi cập nhật dịch thuật, vá lỗi, cập nhật link sẽ được lưu giữ tại đây để người chơi theo dõi.</span>
            </div>

            {/* Sub-section: Add New Update Log */}
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-3">
              <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Viết Nhật ký cập nhật mới (Tùy chọn)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-1 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Phiên bản</span>
                  <input
                    type="text"
                    value={newLogVersion}
                    onChange={(e) => setNewLogVersion(e.target.value)}
                    placeholder="ví dụ: v1.1, Build Fix..."
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg outline-none text-slate-200 text-xs"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">Nội dung thay đổi</span>
                  <input
                    type="text"
                    value={newLogContent}
                    onChange={(e) => setNewLogContent(e.target.value)}
                    placeholder="Sửa lỗi dịch thuật chương 2, nạp thêm link tải Fshare..."
                    className="w-full p-2 bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-lg outline-none text-slate-200 text-xs"
                  />
                </div>
              </div>
              <p className="text-[9.5px] text-slate-500 leading-normal">
                💡 Khi lưu game, thông tin cập nhật trên sẽ tự động được thêm vào lịch sảnh của trò chơi với mốc thời gian ngày hôm nay.
              </p>
            </div>

            {/* Historic logs list */}
            {gameChangelogs.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-400 uppercase block">Nhật ký hiện có ({gameChangelogs.length})</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {gameChangelogs.map((history, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/60 border border-slate-900 rounded-lg flex items-start gap-3 justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300 font-sans">{history.version}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{history.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 break-words leading-relaxed">{history.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...gameChangelogs];
                          updated.splice(idx, 1);
                          setGameChangelogs(updated);
                        }}
                        className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        title="Xóa nhật ký này"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Actions footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-900">
            {selectedGameToEdit && (
              <button
                type="button"
                id="delete-editing-game-btn"
                onClick={() => {
                  if (selectedGameToEdit) {
                    setDeletingGameId(selectedGameToEdit.id);
                    setDeletingGameTitle(selectedGameToEdit.title);
                  }
                }}
                className="px-6 py-2.5 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all mr-auto cursor-pointer"
              >
                Xóa game này
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetFormFields();
                setActiveSubTab('stats');
              }}
              className="px-6 py-2.5 border border-slate-800 hover:bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submittingForm}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {submittingForm ? 'Đang thực hiện...' : (selectedGameToEdit ? 'Cập Nhật Game' : 'Đăng Tải Lên TheRum')}
            </button>
          </div>

        </form>
      )}

      {/* SUB-TAB CONTENTS: Reports List */}
      {activeSubTab === 'reports' && (
        <div className="space-y-4">
          
          <div className="border border-slate-900 bg-slate-950 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-900 text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              Danh sách báo liên kết tải hỏng từ người dùng
            </div>

            {reports.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-xs">
                Tuyệt vời! Hiện tại không có liên kết tải nào bị lỗi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-900">
                  <thead className="bg-slate-900/30 text-slate-500 font-mono">
                    <tr>
                      <th className="p-4 font-bold uppercase">Tên VN Game / Slug</th>
                      <th className="p-4 font-bold uppercase">Thành viên báo cáo</th>
                      <th className="p-4 font-bold uppercase">Nội dung lỗi chi tiết</th>
                      <th className="p-4 font-bold uppercase text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    {reports.map(report => (
                      <tr key={report.id} className={`hover:bg-slate-900/10 transition-colors ${report.status === 'resolved' ? 'opacity-50' : ''}`}>
                        <td className="p-4">
                          <p className="font-bold text-slate-200">{report.gameTitle}</p>
                          <p className="text-[10px] text-slate-500">ID: {report.gameId}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-400">{report.username}</p>
                          <p className="text-[9px] text-slate-600 font-mono">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="p-4 max-w-sm">
                          <p className="text-xs text-slate-400 leading-relaxed font-sans">{report.message}</p>
                        </td>
                        <td className="p-4 text-right">
                          {report.status === 'pending' ? (
                            <button
                              onClick={() => resolveReport(report.id)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 ml-auto"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Xử lý xong</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-bold uppercase flex items-center justify-end gap-1 select-none">
                              <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
                              <span>Đã xử lý</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* SUB-TAB CONTENTS: Custom configuration manager */}
      {activeSubTab === 'config' && (
        <div className="space-y-6">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>
              Quản trị viên có thể tùy chỉnh thêm, sửa, xóa các Thể loại, Động cơ Game, và Hệ điều hành hỗ trợ. Mọi thay đổi sẽ cập nhật trực tiếp lên bộ lọc danh sách game ngoài Trang chủ và Trình đăng/sửa game!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. GENRES COLUMN */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Thể loại Visual VN</h3>
                <span className="text-[10px] text-zinc-500 font-mono font-bold">{(dbConfig.genres.length > 0 ? dbConfig.genres : DEFAULT_GENRES).length} Thể loại</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {(dbConfig.genres.length > 0 ? dbConfig.genres : DEFAULT_GENRES).map((genre, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/40 border border-white/5 rounded-xl group/item">
                    <span className="text-xs font-semibold text-slate-200">{genre}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = dbConfig.genres.length > 0 ? [...dbConfig.genres] : [...DEFAULT_GENRES];
                        current.splice(idx, 1);
                        setDbConfig({ ...dbConfig, genres: current });
                      }}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Xóa thể loại này"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm thể loại mới..."
                  id="new-genre-input"
                  className="flex-1 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const current = dbConfig.genres.length > 0 ? [...dbConfig.genres] : [...DEFAULT_GENRES];
                        if (!current.includes(val)) {
                          setDbConfig({ ...dbConfig, genres: [...current, val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-genre-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      const current = dbConfig.genres.length > 0 ? [...dbConfig.genres] : [...DEFAULT_GENRES];
                      if (!current.includes(val)) {
                        setDbConfig({ ...dbConfig, genres: [...current, val] });
                        input.value = '';
                      }
                    }
                  }}
                  className="px-3 bg-emerald-500 hover:bg-emerald-450 text-slate-955 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* 2. ENGINES COLUMN */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Động cơ Game (Engines)</h3>
                <span className="text-[10px] text-zinc-500 font-mono font-bold">{(dbConfig.engines.length > 0 ? dbConfig.engines : DEFAULT_ENGINES).length} Động cơ</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {(dbConfig.engines.length > 0 ? dbConfig.engines : DEFAULT_ENGINES).map((eng, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/40 border border-white/5 rounded-xl group/item">
                    <span className="text-xs font-semibold text-slate-200">{eng}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = dbConfig.engines.length > 0 ? [...dbConfig.engines] : [...DEFAULT_ENGINES];
                        current.splice(idx, 1);
                        setDbConfig({ ...dbConfig, engines: current });
                      }}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Xóa động cơ này"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm động cơ mới..."
                  id="new-engine-input"
                  className="flex-1 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const current = dbConfig.engines.length > 0 ? [...dbConfig.engines] : [...DEFAULT_ENGINES];
                        if (!current.includes(val)) {
                          setDbConfig({ ...dbConfig, engines: [...current, val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-engine-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      const current = dbConfig.engines.length > 0 ? [...dbConfig.engines] : [...DEFAULT_ENGINES];
                      if (!current.includes(val)) {
                        setDbConfig({ ...dbConfig, engines: [...current, val] });
                        input.value = '';
                      }
                    }
                  }}
                  className="px-3 bg-emerald-500 hover:bg-emerald-450 text-slate-955 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* 3. PLATFORMS COLUMN */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-5 rounded-2xl space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">Hệ điều hành hỗ trợ</h3>
                <span className="text-[10px] text-zinc-500 font-mono font-bold">{(dbConfig.platforms.length > 0 ? dbConfig.platforms : DEFAULT_PLATFORMS).length} HĐH</span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin">
                {(dbConfig.platforms.length > 0 ? dbConfig.platforms : DEFAULT_PLATFORMS).map((plat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/40 border border-white/5 rounded-xl group/item">
                    <span className="text-xs font-semibold text-slate-200">{plat}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const current = dbConfig.platforms.length > 0 ? [...dbConfig.platforms] : [...DEFAULT_PLATFORMS];
                        current.splice(idx, 1);
                        setDbConfig({ ...dbConfig, platforms: current });
                      }}
                      className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                      title="Xóa HĐH này"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Thêm hệ điều hành mới..."
                  id="new-platform-input"
                  className="flex-1 px-3 py-2 bg-slate-950 hover:bg-slate-900 border border-white/5 rounded-xl text-xs outline-none focus:border-emerald-500 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val) {
                        const current = dbConfig.platforms.length > 0 ? [...dbConfig.platforms] : [...DEFAULT_PLATFORMS];
                        if (!current.includes(val)) {
                          setDbConfig({ ...dbConfig, platforms: [...current, val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('new-platform-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      const current = dbConfig.platforms.length > 0 ? [...dbConfig.platforms] : [...DEFAULT_PLATFORMS];
                      if (!current.includes(val)) {
                        setDbConfig({ ...dbConfig, platforms: [...current, val] });
                        input.value = '';
                      }
                    }
                  }}
                  className="px-3 bg-emerald-500 hover:bg-emerald-450 text-slate-955 font-black text-xs rounded-xl transition-all cursor-pointer"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-zinc-400">Hãy nhấn "Lưu Thay Đổi Cấu Cấu Hình" sau khi hoàn tất tùy chỉnh</span>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={submittingForm}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/15 cursor-pointer disabled:opacity-50 w-full sm:w-auto text-center"
            >
              {submittingForm ? 'Đang lưu...' : 'Lưu Thay Đổi Cấu Hình'}
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              {formSuccess}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB CONTENTS: Custom user accounts manager */}
      {activeSubTab === 'users' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-400 text-xs shadow-md">
            <Sparkles className="w-5 h-5 shrink-0" />
            <span>
              <strong>Quản lý cấp quyền thành viên:</strong> Bạn có thể thăng cấp quyền tài khoản cho thành viên thường lên <strong>Dịch giả</strong> (để tự đăng tải, quản lý kho game dịch thuật của riêng họ) hoặc <strong>Quản trị viên</strong> (toàn quyền hệ thống).
            </span>
          </div>

          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-6 rounded-2xl shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-slate-204">Danh Sách Tài Khoản Người Dùng</h3>
              <span className="text-xs font-mono font-bold text-zinc-500">{usersList.length} Tài khoản</span>
            </div>

            {userActionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 animate-slide-in">
                {userActionError}
              </div>
            )}
            {userActionSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 animate-slide-in">
                {userActionSuccess}
              </div>
            )}

            {loadingUsers ? (
              <div className="text-center py-12 text-xs text-zinc-500 font-mono">Đang tải danh sách tài khoản...</div>
            ) : usersList.length === 0 ? (
              <div className="text-center py-12 text-xs text-zinc-500 font-mono">Không có dữ liệu tài khoản nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/5">
                  <thead className="bg-zinc-950/40 text-zinc-500 uppercase font-mono">
                    <tr>
                      <th className="p-4 font-bold">Người dùng</th>
                      <th className="p-4 font-bold">Thư điện tử</th>
                      <th className="p-4 font-bold">Vai trò hiện tại</th>
                      <th className="p-4 font-bold">Điều chỉnh phân quyền</th>
                      <th className="p-4 font-bold text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-300">
                    {usersList.map(u => (
                      <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-850 border border-white/10 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-100">{u.username}</p>
                            <p className="text-[10px] text-slate-500">ID: {u.id}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-zinc-400">
                          {u.email}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                            u.role === 'admin' 
                              ? 'bg-red-950/40 text-red-400 border-red-900/20' 
                              : u.role === 'dichgia' 
                                ? 'bg-amber-950/40 text-amber-500 border-amber-905' 
                                : u.role === 'vip'
                                  ? 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-900/20'
                                  : 'bg-slate-950/40 text-slate-400 border-slate-900/20'
                          }`}>
                            {u.role === 'admin' ? 'Admin' : u.role === 'dichgia' ? 'Dịch giả' : u.role === 'vip' ? 'VIP' : 'Thành viên'}
                          </span>
                        </td>
                        <td className="p-4">
                          {u.id !== 'admin-therum' ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={editingUserId === u.id ? editingUserRole : u.role}
                                onChange={(e) => {
                                  setEditingUserId(u.id);
                                  setEditingUserRole(e.target.value as any);
                                }}
                                className="bg-slate-950 border border-white/10 hover:border-white/20 px-2 py-1 rounded text-xs text-white outline-none cursor-pointer"
                              >
                                <option value="user">Thành viên</option>
                                <option value="vip">Thành viên VIP</option>
                                <option value="dichgia">Dịch giả</option>
                                <option value="admin">Quản trị viên</option>
                              </select>
                              {editingUserId === u.id && editingUserRole !== u.role && (
                                <button
                                  onClick={() => handleUpdateUserRole(u.id, editingUserRole)}
                                  className="p-1 px-2.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 hover:bg-emerald-500/80 font-bold rounded text-[10px] transition-colors cursor-pointer"
                                >
                                  Lưu
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-650 font-mono italic">Mặc định hệ thống</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {u.id !== 'admin-therum' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleResetUserPassword(u.id)}
                                className="p-1.5 text-zinc-500 hover:text-amber-400 border border-transparent hover:border-slate-800 rounded transition-all cursor-pointer"
                                title="Đặt lại mật khẩu về mặc định (user123)"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeletingUserId(u.id);
                                  setDeletingUserName(u.username);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-red-400 border border-transparent hover:border-slate-800 rounded transition-all cursor-pointer"
                                title="Xóa tài khoản vĩnh viễn"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-650 font-mono">Bảo vệ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB CONTENTS: Database Backup & Restore */}
      {activeSubTab === 'database' && currentUser?.role === 'admin' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 text-xs shadow-md">
            <Database className="w-5 h-5 shrink-0 animate-pulse" />
            <span>
              <strong>Quản lý dữ liệu hệ thống (Sao lưu & Khôi phục):</strong> Bạn có thể xuất toàn bộ dữ liệu ứng dụng hiện tại (bao gồm tài khoản, tựa game, thể loại, yêu cầu dịch,...) thành file JSON hoặc tải lên một file dữ liệu JSON hợp lệ để ghi đè/khôi phục hệ thống.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Export database Card */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Download className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider font-sans">Xuất dữ liệu ứng dụng</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Tải về toàn bộ cơ sở dữ liệu `db.json` hiện tại của TheRum dưới dạng file `.json`. Bạn có thể lưu trữ file này để làm bản sao lưu dự phòng.
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setFormError('');
                    setFormSuccess('');
                    try {
                      const token = localStorage.getItem('therum_token');
                      const res = await fetch('/api/admin/backup', {
                        headers: { 'Authorization': `Bearer ${token}` }
                      });
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `therum-db-backup-${new Date().toISOString().split('T')[0]}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                        setFormSuccess('Tải file sao lưu dữ liệu thành công!');
                      } else {
                        const err = await res.json();
                        setFormError(err.error || 'Lỗi khi tải file sao lưu');
                      }
                    } catch {
                      setFormError('Lỗi kết nối máy chủ không phản hồi');
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-955 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/15 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-slate-955" />
                  <span>Tải Xuống Bản Sao Lưu (.json)</span>
                </button>
              </div>
            </div>

            {/* Import database Card */}
            <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm p-6 rounded-2xl shadow-md space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500">
                  <Upload className="w-5 h-5" />
                  <h3 className="text-sm font-bold uppercase tracking-wider font-sans">Khôi phục / Nạp dữ liệu</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  Chọn file backup `.json` hợp lệ từ máy tính của bạn để khôi phục cơ sở dữ liệu. 
                  <span className="text-red-400 font-bold block mt-1">⚠️ Cảnh báo: Thao tác này sẽ ghi đè và thay thế toàn bộ dữ liệu hiện tại trên hệ thống!</span>
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <input
                  type="file"
                  id="db-upload-input"
                  accept=".json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setFormError('');
                    setFormSuccess('');
                    setSubmittingForm(true);

                    const reader = new FileReader();
                    reader.onload = async (event) => {
                      try {
                        const jsonText = event.target?.result as string;
                        const parsedData = JSON.parse(jsonText);

                        const token = localStorage.getItem('therum_token');
                        const res = await fetch('/api/admin/restore', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(parsedData)
                        });

                        const resData = await res.json();
                        if (res.ok) {
                          setFormSuccess(resData.message || 'Khôi phục dữ liệu thành công!');
                          onRefreshedGames();
                          fetchAdminData();
                        } else {
                          setFormError(resData.error || 'Lỗi khi phục hồi dữ liệu');
                        }
                      } catch (err: any) {
                        setFormError('Lỗi đọc file JSON hoặc định dạng file không hợp lệ: ' + err.message);
                      } finally {
                        setSubmittingForm(false);
                        e.target.value = '';
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('db-upload-input')?.click();
                  }}
                  disabled={submittingForm}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-450 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/15 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Upload className="w-4 h-4" />
                  <span>{submittingForm ? 'Đang Nạp dữ liệu...' : 'Chọn File & Khôi Phục Dữ Liệu'}</span>
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
              {formSuccess}
            </div>
          )}
        </div>
      )}

      {/* USER DELETE CONFIRMATION MODAL */}
      {deletingUserId && (
        <div id="delete-user-confirm-overlay" className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div id="delete-user-confirm-modal" className="bg-zinc-950 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Xóa tài khoản vĩnh viễn</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Bạn có chắc chắn muốn xóa tài khoản của thành viên <strong className="text-zinc-100 font-extrabold">{deletingUserName}</strong> ra khỏi hệ thống TheRum? Người dùng này sẽ mất toàn bộ quyền truy cập và dữ liệu liên quan!
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeletingUserId(null);
                  setDeletingUserName('');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer font-sans"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUserAccount(deletingUserId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-450 text-slate-950 hover:text-white hover:bg-red-500/80 font-black rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Xác nhận XÓA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NON-BLOCKING CUSTOM DELETE CONFIRMATION MODAL (Replaces iframe-sandboxed window.confirm) */}
      {deletingGameId && (
        <div id="delete-confirm-overlay" className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div id="delete-confirm-modal" className="bg-zinc-950 border border-white/10 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertOctagon className="w-5 h-5 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-widest font-mono">Xác nhận xóa trò chơi</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Bạn có chắc chắn muốn gỡ bỏ game <strong className="text-zinc-100 font-extrabold">{deletingGameTitle}</strong> ra khỏi hệ thống TheRum? Hành động này sẽ <span className="text-red-400 font-bold">không thể hoàn tác</span>!
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                id="delete-cancel-btn"
                onClick={() => {
                  setDeletingGameId(null);
                  setDeletingGameTitle('');
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white rounded-xl text-[11px] font-bold transition-all cursor-pointer font-sans"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                id="delete-confirm-btn"
                onClick={async () => {
                  if (deletingGameId) {
                    await executeDelete(deletingGameId);
                  }
                  setDeletingGameId(null);
                  setDeletingGameTitle('');
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-450 text-slate-950 hover:text-white hover:bg-red-500/80 font-black rounded-xl text-[11px] uppercase tracking-wider transition-all cursor-pointer font-sans"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
