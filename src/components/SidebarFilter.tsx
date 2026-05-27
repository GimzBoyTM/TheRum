import { useState } from 'react';
import { Filter, Check, RotateCcw, ChevronDown } from 'lucide-react';

interface SidebarFilterProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  selectedEngine: string;
  onSelectEngine: (engine: string) => void;
  selectedPlatform: string;
  onSelectPlatform: (platform: string) => void;
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  onResetFilters: () => void;
  genres?: string[];
  engines?: string[];
  platforms?: string[];
}

const DEFAULT_GENRES = [
  'Romance', 
  'Drama', 
  'Slice of Life', 
  'Action', 
  'Fantasy', 
  'Mystery', 
  'Sci-Fi', 
  'Psychological', 
  'Thriller', 
  'Gothic',  
  'Tragedy', 
  'Horror', 
  'School Life'
];

const DEFAULT_ENGINES = ['RenPy', 'KiriKiri', 'Unity', 'RPG Maker', 'TyranoBuilder'];
const DEFAULT_PLATFORMS = ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5'];
const STATUSES = ['Hoàn thành', 'Đang dịch', 'Tạm ngưng', 'Demo'];

export default function SidebarFilter({
  selectedTags,
  onToggleTag,
  selectedEngine,
  onSelectEngine,
  selectedPlatform,
  onSelectPlatform,
  selectedStatus,
  onSelectStatus,
  onResetFilters,
  genres = DEFAULT_GENRES,
  engines = DEFAULT_ENGINES,
  platforms = DEFAULT_PLATFORMS
}: SidebarFilterProps) {

  const [isOpen, setIsOpen] = useState(false);
  const hasActiveFilters = selectedTags.length > 0 || selectedEngine !== '' || selectedPlatform !== '' || selectedStatus !== '';

  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:space-y-6">
      
      {/* Filters Title Header - Mobile (Interactive button to toggle) */}
      <button 
        id="toggle-filters-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full lg:hidden flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-sm cursor-pointer select-none text-left"
      >
        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm uppercase tracking-wider font-sans">
          <Filter className="w-4 h-4 text-emerald-450" />
          <span>Bộ Lọc Game</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onResetFilters();
              }}
              className="text-[11px] text-emerald-450 hover:text-emerald-300 font-bold uppercase tracking-wider transition-colors"
            >
              Đặt Lại
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
        </div>
      </button>

      {/* Filters Title Header - Desktop (Static title) */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-100 font-bold text-sm uppercase tracking-wider font-sans">
          <Filter className="w-4 h-4 text-emerald-450" />
          <span>Bộ Lọc Game</span>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer uppercase tracking-wider transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt Lại</span>
          </button>
        )}
      </div>

      {/* Collapsible Filter Body */}
      <div className={`space-y-4 lg:space-y-6 ${isOpen ? 'block' : 'hidden lg:block'}`}>

      {/* Filter Section: Status */}
      <div className="border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-sm p-4 shadow-md">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">Trạng Thái Dịch</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectStatus('')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedStatus === '' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
            }`}
          >
            <span>Tất cả</span>
            {selectedStatus === '' && <Check className="w-3 h-3" />}
          </button>
          {STATUSES.map(status => (
            <button
              key={status}
              onClick={() => onSelectStatus(status)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedStatus.toLowerCase() === status.toLowerCase() 
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
              }`}
            >
              <span>{status}</span>
              {selectedStatus.toLowerCase() === status.toLowerCase() && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section: Platforms */}
      <div className="border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-sm p-4 shadow-md">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">Hệ Điều Hành</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectPlatform('')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedPlatform === '' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
            }`}
          >
            <span>Tất cả</span>
            {selectedPlatform === '' && <Check className="w-3 h-3" />}
          </button>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => onSelectPlatform(platform)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedPlatform.toLowerCase() === platform.toLowerCase()
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
              }`}
            >
              <span>{platform}</span>
              {selectedPlatform.toLowerCase() === platform.toLowerCase() && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section: Engines */}
      <div className="border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-sm p-4 shadow-md">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 font-mono">Game Engine</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => onSelectEngine('')}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedEngine === '' 
                ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
            }`}
          >
            <span>Tất cả</span>
            {selectedEngine === '' && <Check className="w-3 h-3" />}
          </button>
          {engines.map(engine => (
            <button
              key={engine}
              onClick={() => onSelectEngine(engine)}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedEngine.toLowerCase() === engine.toLowerCase()
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white border border-transparent'
              }`}
            >
              <span>{engine === 'RenPy' ? "Ren'Py" : engine}</span>
              {selectedEngine.toLowerCase() === engine.toLowerCase() && <Check className="w-3 h-3" />}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Section: Genres (Multi-select) */}
      <div className="border border-white/5 rounded-2xl bg-zinc-900/40 backdrop-blur-sm p-4 shadow-md">
        <h3 className="text-xs font-bold text-zinc-550 uppercase tracking-widest mb-3 font-mono">Thể loại Visual Novel</h3>
        <div className="flex flex-wrap gap-1.5">
          {genres.map(genre => {
            const isSelected = selectedTags.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => onToggleTag(genre)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm shadow-emerald-500/25'
                    : 'bg-zinc-800/40 text-zinc-400 border-white/5 hover:text-white hover:bg-zinc-800/80'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      </div> {/* Collapsible Filter Body */}

    </aside>
  );
}
