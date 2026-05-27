import { Download, Bookmark, Globe, Smartphone, Monitor, Shield, Layers } from 'lucide-react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onSelect: (slug: string) => void;
  key?: string | number | any;
}

export default function GameCard({ game, onSelect }: GameCardProps) {
  
  // Platform icon helper
  const renderPlatformIcon = (platform: string) => {
    const term = platform.toLowerCase();
    if (term.includes('win')) return <span key={platform} title="Windows PC"><Monitor className="w-3.5 h-3.5 text-slate-400" /></span>;
    if (term.includes('and')) return <span key={platform} title="Android OS"><Smartphone className="w-3.5 h-3.5 text-slate-400" /></span>;
    if (term.includes('web') || term.includes('html')) return <span key={platform} title="Chơi trên Web"><Globe className="w-3.5 h-3.5 text-slate-400" /></span>;
    return <span key={platform} title={platform}><Monitor className="w-3.5 h-3.5 text-slate-400" /></span>;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('hoàn thành')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (s.includes('dịch') || s.includes('tiến hành')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (s.includes('tạm ngưng')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  return (
    <div 
      onClick={() => onSelect(game.slug)}
      className="group flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-zinc-900/60 backdrop-blur-sm border border-white/5 hover:border-emerald-500/30 hover:bg-zinc-900/80 transition-all cursor-pointer select-none shadow-md"
    >
      
      {/* Cover / Thumbnail Column */}
      <div className="w-full sm:w-28 h-40 sm:h-auto rounded-xl overflow-hidden shrink-0 bg-zinc-950 relative">
        <img 
          src={game.coverUrl} 
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        {/* Status Badge absolute overlay on mobile */}
        <div className="absolute top-2 left-2 sm:hidden">
          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border backdrop-blur-md ${getStatusColor(game.status)}`}>
            {game.status}
          </span>
        </div>
      </div>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          
          {/* Title & Badge */}
          <div className="flex items-start justify-between gap-2.5 mb-1.5Packed">
            <h3 className="text-base font-bold font-sans text-zinc-100 group-hover:text-emerald-400 transition-colors truncate">
              {game.title}
            </h3>
            
            <span className={`hidden sm:inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusColor(game.status)}`}>
              {game.status}
            </span>
          </div>

          {/* Subtitle / Author Translator */}
          <p className="text-xs text-zinc-550 font-medium mb-2 font-sans flex items-center gap-1.5">
            <span>Dịch bởi:</span>
            <span className="text-zinc-300 font-bold">{game.creator}</span>
            <span className="text-zinc-700 font-normal">|</span>
            <span>Hãng:</span>
            <span className="text-zinc-400 font-semibold">{game.developer}</span>
          </p>

          {/* Short Description */}
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
            {game.shortDescription}
          </p>

        </div>

        {/* Footer Metrics & Tags */}
        <div className="space-y-2.5">
          
          {/* Metadata Badges / Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            
            {/* Engine badge */}
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-850 border border-white/5 text-zinc-400 font-mono">
              {game.engine === 'RenPy' ? "Ren'Py" : game.engine}
            </span>

            {/* Tags preview (max 3) */}
            {game.tags.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/40 border border-white/5 text-zinc-300">
                {tag}
              </span>
            ))}
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Platforms & Interactive Stats */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium mx-1">
            
            {/* Target platforms */}
            <div className="flex items-center gap-1.5">
              {game.platforms.map(p => renderPlatformIcon(p))}
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                <Bookmark className="w-3.5 h-3.5 text-zinc-500" />
                <span>{game.bookmarksCount}</span>
              </span>
              <span className="flex items-center gap-1 hover:text-emerald-400 transition-colors">
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>{game.downloadsCount}</span>
              </span>
              {game.ageRating === '18+' && (
                <span className="flex items-center gap-1 text-red-500 bg-red-500/10 border border-red-500/10 text-[9px] font-extrabold px-1.5 rounded uppercase">
                  18+
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
