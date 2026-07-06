import { Search, ShieldAlert, LogOut, LogIn, Compass, Layers, Sparkles, User as UserIcon, KeyRound } from 'lucide-react';
import { User } from '../types';
import iconUrl from '../../assets/icon.png';

interface HeaderProps {
  user: User | null;
  onNavigate: (route: string) => void;
  currentRoute: string;
  onLogout: () => void;
  onTriggerLogin: () => void;
  onChangePassword: () => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onlineCount: number;
}

export default function Header({ 
  user, 
  onNavigate, 
  currentRoute, 
  onLogout, 
  onTriggerLogin,
  onChangePassword,
  searchTerm,
  onSearchChange,
  onlineCount
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#09090b]/60 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Online Counter */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => onNavigate('/')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group shrink-0"
          >
            <img 
              src={iconUrl} 
              alt="TheRum Icon" 
              className="w-8 h-8 object-contain rounded-lg group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/25" 
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-black tracking-tight text-white leading-none group-hover:text-emerald-400 transition-colors">
                TheRum<span className="text-emerald-500 underline decoration-2 underline-offset-4 font-black">VN</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/60 border border-white/5 rounded-full select-none shadow-inner shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold text-zinc-400 font-mono leading-none tracking-tight">
              {onlineCount} <span className="text-zinc-500 font-sans font-medium">online</span>
            </span>
          </div>
        </div>

        {/* Global/Quick Search Box */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            id="quick-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm game..."
            className="w-full bg-zinc-800/50 border border-white/5 rounded-full py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-zinc-500 text-zinc-200 transition-all"
          />
        </div>

        {/* Action Controls & User profiles */}
        <div className="flex items-center gap-3">
          
          <button
            onClick={() => onNavigate('/')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentRoute === '/' 
                ? 'text-emerald-400 bg-emerald-500/10' 
                : 'text-zinc-400 hover:text-white transition-colors'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="hidden sm:inline">Khám Phá</span>
          </button>

          <button
            onClick={() => onNavigate('/requests')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              currentRoute === '/requests' 
                ? 'text-emerald-400 bg-emerald-500/10 border border-white/5 shadow-sm' 
                : 'text-zinc-400 hover:text-white transition-colors'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-450" />
            <span>Yêu Cầu Game</span>
          </button>

          {(user?.role === 'admin' || user?.role === 'dichgia') && (
            <button
              onClick={() => onNavigate('/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentRoute === '/admin' 
                  ? 'text-emerald-450 bg-emerald-500/10 border border-white/5' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-805'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{user?.role === 'admin' ? 'Quản Trị viên' : 'Góc Dịch Giả'}</span>
            </button>
          )}

          <div className="w-px h-5 bg-white/5 hidden sm:block" />

          {user ? (
            <div className="flex items-center gap-3">
              <div 
                onClick={() => onNavigate('/bookmarks')}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <img 
                  src={user.avatarUrl || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=user'} 
                  alt={user.username}
                  className="w-8 h-8 rounded-full border border-white/10 object-cover group-hover:border-emerald-500 transition-colors"
                />
                <div className="hidden lg:block text-left max-w-[100px] truncate">
                  <p className="text-xs font-bold text-zinc-100 truncate">{user.username}</p>
                  <p className="text-[10px] text-zinc-500 capitalize font-medium">{user.role}</p>
                </div>
              </div>
              <button
                onClick={onChangePassword}
                title="Đổi mật khẩu"
                className="p-1.5 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/10 rounded-lg transition-all cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={onLogout}
                title="Đăng xuất"
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/10 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onTriggerLogin}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/15"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
