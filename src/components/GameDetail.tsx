import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, Download, Bookmark, Award, AlertTriangle, Monitor, 
  Smartphone, Globe, Calendar, Eye, Heart, Key, Check, ChevronRight, MessageSquare 
} from 'lucide-react';
import { Game, User } from '../types';

interface GameDetailProps {
  game: Game;
  user: User | null;
  onBack: () => void;
  onBookmarkToggle: (gameId: string) => Promise<boolean>;
  isBookmarked: boolean;
  onTriggerLogin: () => void;
}

export default function GameDetail({ 
  game, 
  user, 
  onBack, 
  onBookmarkToggle, 
  isBookmarked: initialBookmarked,
  onTriggerLogin
}: GameDetailProps) {
  const [activeTab, setActiveTab] = useState<'desc' | 'download' | 'screenshots' | 'changelog'>('desc');
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarksCount, setBookmarksCount] = useState(game.bookmarksCount);
  const [downloadsCount, setDownloadsCount] = useState(game.downloadsCount);
  const [reportMsg, setReportMsg] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  // Platform icon helper
  const renderPlatformIcon = (platform: string) => {
    const term = platform.toLowerCase();
    if (term.includes('win')) return <span key={platform} title="Windows"><Monitor className="w-4 h-4 text-emerald-400" /></span>;
    if (term.includes('and')) return <span key={platform} title="Android"><Smartphone className="w-4 h-4 text-emerald-400" /></span>;
    if (term.includes('web') || term.includes('html')) return <span key={platform} title="Web"><Globe className="w-4 h-4 text-emerald-400" /></span>;
    return <span key={platform} title={platform}><Monitor className="w-4 h-4 text-slate-400" /></span>;
  };

  const handleBookmark = async () => {
    if (!user) {
      onTriggerLogin();
      return;
    }
    const resultStatus = await onBookmarkToggle(game.id);
    setIsBookmarked(resultStatus);
    setBookmarksCount(prev => resultStatus ? prev + 1 : Math.max(0, prev - 1));
  };

  const handleDownloadClick = async (linkUrl: string) => {
    // Increment download counter
    try {
      const res = await fetch(`/api/games/${game.id}/download-click`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDownloadsCount(data.count);
      }
    } catch {
      // safe fallback
    }
    // Open url
    window.open(linkUrl, '_blank');
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onTriggerLogin();
      return;
    }
    if (!reportMsg.trim()) return;

    setSubmittingReport(true);
    setReportError('');
    setReportSuccess('');

    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch(`/api/games/${game.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: reportMsg })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Báo lỗi thất bại');
      }

      setReportSuccess(data.message);
      setReportMsg('');
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess('');
      }, 2000);
    } catch (err: any) {
      setReportError(err.message || 'Lỗi hệ thống');
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <button 
        id="back-list-btn"
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay Lại Danh Sách</span>
      </button>

      {/* Banner + Cover Header Block */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-md shadow-xl">
        
        {/* Large soft blurry background banner */}
        <div className="h-64 sm:h-72 w-full relative">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
          <img 
            src={game.bannerUrl} 
            alt={game.title}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Branding Elements Layer */}
        <div className="p-6 md:p-8 relative z-20 mt-[-64px] sm:mt-[-80px] flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          
          {/* Main Cover art wrapper */}
          <div className="w-28 sm:w-36 h-40 sm:h-52 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-2xl relative bg-zinc-950 shrink-0">
            <img 
              src={game.coverUrl} 
              alt={game.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Title and metadata overview */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-450 border-emerald-500/20">
                {game.status}
              </span>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-zinc-800/40 border-white/5 text-zinc-400 font-mono">
                {game.engine}
              </span>
            </div>

            <h2 id="game-detail-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
              {game.title}
            </h2>

            <p className="text-sm text-zinc-400 max-w-2xl font-medium font-sans">
              Dự án Việt ngữ thuộc sở hữu và dịch thuật bởi cộng đồng <span className="text-emerald-450 font-bold">{game.creator}</span>.
            </p>

            {/* Quick action highlights */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-500" />
                <span><strong className="text-zinc-300">{game.viewsCount}</strong> lượt xem</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-500" />
                <span><strong className="text-zinc-300">{downloadsCount}</strong> lượt tải</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-emerald-500" />
                <span><strong className="text-zinc-300">{bookmarksCount}</strong> thích</span>
              </span>
            </div>
          </div>

          {/* Dynamic Desktop Actions Column */}
          <div className="flex sm:flex-col gap-2.5 w-full sm:w-auto shrink-0 mt-4 sm:mt-0 justify-center">
            
            <button
              id="direct-download-tab-btn"
              onClick={() => {
                setActiveTab('download');
                setTimeout(() => {
                  const tabsElement = document.getElementById('game-tabs-section');
                  if (tabsElement) {
                    tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 50);
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black font-sans text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg bg-emerald-500 hover:bg-emerald-450 text-slate-950 shadow-emerald-500/15 active:scale-95 border border-emerald-400/20"
            >
              <Download className="w-4 h-4" />
              <span>Tải Game Bản Dịch</span>
            </button>

            <button
              id="bookmark-game-btn"
              onClick={handleBookmark}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold font-sans text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                isBookmarked 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/15' 
                  : 'bg-zinc-800/40 backdrop-blur-sm hover:bg-zinc-850 text-zinc-300 border border-white/10'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-slate-950' : ''}`} />
              <span>{isBookmarked ? 'Đã yêu thích' : 'Yêu thích (Bookmark)'}</span>
            </button>

            <button
              id="report-game-btn"
              onClick={() => {
                if (!user) {
                  onTriggerLogin();
                } else {
                  setShowReportModal(true);
                }
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-zinc-800/40 border border-white/5 hover:border-red-500/30 text-xs font-bold uppercase tracking-wider font-sans text-red-450 hover:text-red-300 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Báo liên kết tải hỏng</span>
            </button>

          </div>

        </div>

      </div>

      {/* Main Content & Sidebar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Dynamic Tabs Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tab Header bar */}
          <div id="game-tabs-section" className="flex border-b border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('desc')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'desc' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-550 hover:text-white'
              }`}
            >
              Giới thiệu
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer relative ${
                activeTab === 'download' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-550 hover:text-white'
              }`}
            >
              <span>Tải Game</span>
              <span className="absolute -top-1 -right-1 flex h-2 w-2 select-none">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('screenshots')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'screenshots' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-550 hover:text-white'
              }`}
            >
              Thư viện
            </button>
            <button
              onClick={() => setActiveTab('changelog')}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'changelog' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-zinc-550 hover:text-white'
              }`}
            >
              Lịch sử dịch
            </button>
          </div>

          {/* TAB CARD CONTENTS */}
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-6 shadow-sm min-h-[300px]">
            
            {/* Tab: Giới thiệu (MarkDown parser or simply neat elements) */}
            {activeTab === 'desc' && (
              <div className="space-y-6 text-zinc-300 text-sm leading-relaxed font-sans">
                <div className="prose prose-invert prose-emerald max-w-none">
                  <h3 className="text-lg font-bold text-zinc-100 font-sans border-b border-white/5 pb-2 mb-4">Chi tiết tác phẩm</h3>
                  <div className="markdown-body">
                    <ReactMarkdown
                      components={{
                        h1: ({node, ...props}) => <h1 className="text-xl font-black text-white mt-5 mb-3 select-none" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mt-4 mb-2 select-none" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-base font-bold text-emerald-400 mt-3.5 mb-2 select-none" {...props} />,
                        p: ({node, ...props}) => <p className="text-xs text-zinc-300 leading-normal mb-3 whitespace-pre-line" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 text-zinc-300 space-y-1.5 list-outside" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 text-zinc-300 space-y-1.5 list-outside" {...props} />,
                        li: ({node, ...props}) => <li className="text-xs text-zinc-300" {...props} />,
                        code: ({node, ...props}) => <code className="bg-zinc-950 px-1 py-0.5 rounded font-mono text-emerald-400 text-xs" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-zinc-950 p-3 rounded-lg overflow-x-auto font-mono text-xs my-3 border border-white/5" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-extrabold text-emerald-300" {...props} />,
                        em: ({node, ...props}) => <em className="italic text-zinc-200" {...props} />,
                        a: ({node, ...props}) => <a className="text-emerald-450 hover:text-emerald-300 underline font-extrabold transition-all" target="_blank" rel="noreferrer" {...props} />,
                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-emerald-500/40 pl-4 py-1 italic bg-emerald-500/5 my-3 rounded-r-lg text-zinc-400" {...props} />,
                      }}
                    >
                      {game.description}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Tải Game */}
            {activeTab === 'download' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-zinc-100 font-sans border-b border-white/5 pb-2 mb-1.5">Liên Kết Tải Bản Việt Hóa</h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Để tri ân công sức của nhóm dịch, tất cả link tải đều cam kết an toàn, không chứa malware/virus hoặc quảng cáo rút gọn kiếm tiền gây phiền toái.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {game.downloadLinks.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
                      <p className="text-zinc-500 text-sm">Hệ thống đang cập nhật liên kết tải cho game này.</p>
                    </div>
                  ) : (
                    game.downloadLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 border border-white/5 hover:border-emerald-500/30 bg-zinc-900/50 hover:bg-zinc-800/80 rounded-xl transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-zinc-200 truncate">{link.label}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-white/5">
                              Lưu trữ trực tuyến
                            </span>
                            {link.password && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 flex items-center gap-1 leading-none">
                                <Key className="w-3 h-3 text-emerald-450 shrink-0" />
                                <span>Giải nén: <strong className="select-all font-bold">{link.password}</strong></span>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDownloadClick(link.url)}
                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/15 shrink-0"
                        >
                          <Download className="w-4 h-4" />
                          <span>Tải Về Ngay</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Hướng dẫn cài đặt bổ sung */}
                <div className="p-4 border border-teal-950/20 bg-zinc-950/40 rounded-xl">
                  <h4 className="text-xs font-extrabold uppercase text-emerald-405 tracking-wider mb-2 font-mono flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-405" />
                    <span>Hướng dẫn cài đặt & chơi</span>
                  </h4>
                  <ul className="list-decimal list-inside space-y-1.5 text-xs text-zinc-400 leading-normal font-sans">
                    <li>Sử dụng WinRAR hoặc 7-Zip để giải nén tệp game/patch đã tải xuống.</li>
                    <li>Sử dụng mật khẩu giải nén <code className="text-emerald-400 bg-emerald-950/20 px-1.5 rounded">therum</code> nếu liên kết tải có hiển thị khóa.</li>
                    <li>Với bản patch rời: Thường copy toàn bộ nội dung dán đè vào thư mục cài đặt gốc chứa file chạy `.exe` của game gốc.</li>
                    <li>Với bản cài đặt Android, vui lòng cài ứng dụng hỗ trợ hoặc cài file cài đặt `.apk` trực tiếp.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Screenshots */}
            {activeTab === 'screenshots' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-100 font-sans border-b border-white/5 pb-2 mb-4">Thư viện hình ảnh Việt hóa</h3>
                
                {game.screenshots.length === 0 ? (
                  <div className="text-center py-10 text-zinc-500 text-sm border border-dashed border-white/10 rounded-xl">
                    Chưa có hình ảnh nào được đăng tải trong thư viện trò chơi.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {game.screenshots.map((screen, idx) => (
                      <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-white/5 relative group bg-zinc-950">
                        <img 
                          src={screen} 
                          alt={`Screenshot ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Changelog */}
            {activeTab === 'changelog' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-zinc-100 font-sans border-b border-white/5 pb-2 mb-4">Tiến Độ & Nhật Ký Cập Nhật Việt Hóa</h3>
                
                <div className="relative border-l border-white/5 pl-5 ml-2 space-y-6">
                  {game.changelogs.map((history, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline dot circle */}
                      <span className="absolute -left-[26px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-zinc-950"></span>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-black text-zinc-100 font-sans">{history.version}</span>
                          <span className="text-[10px] text-zinc-500 font-mono font-bold flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{history.date}</span>
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 bg-zinc-900/30 border border-white/5 p-2.5 rounded-lg leading-relaxed">
                          {history.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Sidebar Metadata Area */}
        <div className="space-y-6">
          
          {/* Metadata Card */}
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Thông Tin Cơ Bản</h3>
            
            <div className="space-y-3 divide-y divide-white/5 text-xs">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-zinc-500 font-semibold font-sans">Trạng thái dịch</span>
                <span className="font-bold text-zinc-200">{game.status}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-zinc-500 font-semibold font-sans">Engine phát triển</span>
                <span className="font-bold text-zinc-200">{game.engine}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-transparent border-t border-white/5">
                <span className="text-zinc-500 font-semibold font-sans">Hệ điều hành</span>
                <div className="flex items-center gap-1">
                  {game.platforms.map(p => renderPlatformIcon(p))}
                  <span className="text-[10px] font-bold text-zinc-350 ml-1">{game.platforms.join(', ')}</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-transparent border-t border-white/5">
                <span className="text-zinc-500 font-semibold font-sans">Độ tuổi đề nghị</span>
                <span className="font-extrabold text-red-400 px-1.5 rounded bg-red-950/20 border border-red-900/30 text-[10px]">
                  {game.ageRating}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-transparent border-t border-white/5">
                <span className="text-zinc-500 font-semibold font-sans">Đơn vị phát triển</span>
                <span className="font-bold text-zinc-200 truncate max-w-[150px]">{game.developer}</span>
              </div>
              <div className="flex justify-between items-center py-2.5 bg-transparent border-t border-white/5">
                <span className="text-zinc-500 font-semibold font-sans">Đăng tải lúc</span>
                <span className="font-mono text-zinc-400">{new Date(game.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Tags Box */}
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Thể loại trò chơi</h3>
            <div className="flex flex-wrap gap-1.5">
              {game.tags.map((tag, idx) => (
                <span key={idx} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-zinc-850 border border-white/5 text-zinc-300 shadow-sm leading-none">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Publisher Card */}
          <div className="border border-white/5 bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-5 flex items-center gap-3 shadow-md">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-black font-extrabold text-sm shadow shadow-emerald-500/10 shrink-0">
              TR
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Thương hiệu Việt hóa</p>
              <h4 className="text-sm font-bold text-zinc-200 truncate">{game.creator}</h4>
            </div>
          </div>

        </div>

      </div>

      {/* REPORT MODAL */}
      {showReportModal && (
        <div id="report-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div id="report-modal" className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative shadow-black/80">
            <div className="h-1 bg-red-400" />
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 text-red-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-lg font-bold font-sans text-white">Báo lỗi liên kết tải game</h3>
              </div>

              {reportSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-350 rounded-lg text-xs flex gap-1.5">
                  <Check className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{reportSuccess}</span>
                </div>
              )}

              {reportError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 text-red-305 rounded-lg text-xs">
                  {reportError}
                </div>
              )}

              <form onSubmit={submitReport} className="space-y-4 mt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest block">Mô tả chi tiết lỗi</label>
                  <textarea
                    required
                    value={reportMsg}
                    onChange={(e) => setReportMsg(e.target.value)}
                    placeholder="ví dụ: Link Google Drive bản Android bị hỏng, lỗi giải nén..."
                    className="w-full h-24 p-3 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/35 rounded-xl outline-none text-zinc-120 text-xs leading-relaxed placeholder:text-zinc-650"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-4 py-2 border border-white/5 bg-zinc-900 hover:bg-zinc-805 text-zinc-400 rounded-lg transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReport || reportSuccess !== ''}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-800 text-slate-950 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {submittingReport ? 'Đang gửi...' : 'Gửi Báo Cáo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
