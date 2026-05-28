import { useState, useEffect, FormEvent } from 'react';
import { Sparkles, ThumbsUp, Plus, Trash2, Calendar, Monitor, Smartphone, AlertCircle, HelpCircle } from 'lucide-react';
import { GameRequest, User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface GameRequestsProps {
  user: User | null;
  onTriggerLogin: () => void;
}

export default function GameRequests({ user, onTriggerLogin }: GameRequestsProps) {
  const [requests, setRequests] = useState<GameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [description, setDescription] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Windows']);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Status updating or deleting state
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch requests from API
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.');
      }
    } catch {
      setError('Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Handle upvoting
  const handleVote = async (id: string) => {
    if (!user) {
      onTriggerLogin();
      return;
    }

    const token = localStorage.getItem('therum_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/requests/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        // Update requests state instantly
        setRequests(prev => prev.map(req => {
          if (req.id === id) {
            return {
              ...req,
              votes: data.votes
            };
          }
          return req;
        }).sort((a, b) => {
          const diff = (b.votes?.length || 0) - (a.votes?.length || 0);
          if (diff !== 0) return diff;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }));
      }
    } catch {
      // Ignore
    }
  };

  // Handle status update (Admin only)
  const handleStatusChange = async (id: string, newStatus: string) => {
    const token = localStorage.getItem('therum_token');
    if (!token) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/requests/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setRequests(prev => prev.map(req => {
          if (req.id === id) {
            return { ...req, status: newStatus as any };
          }
          return req;
        }));
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle request deletion (Admin only)
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa yêu cầu dịch game này?')) {
      return;
    }

    const token = localStorage.getItem('therum_token');
    if (!token) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setRequests(prev => prev.filter(req => req.id !== id));
      }
    } catch {
      // Ignore
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle platform select helper
  const handlePlatformToggle = (plat: string) => {
    if (platforms.includes(plat)) {
      setPlatforms(prev => prev.filter(p => p !== plat));
    } else {
      setPlatforms(prev => [...prev, plat]);
    }
  };

  // Submit request form
  const activeUserRequest = user
    ? requests.find(r => r.userId === user.id && (r.status === 'Chờ duyệt' || r.status === 'Đã duyệt'))
    : null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      onTriggerLogin();
      return;
    }

    if (activeUserRequest) {
      setFormError(`Bạn đã có đề cử "${activeUserRequest.title}" đang ở trạng thái "${activeUserRequest.status}". Vui lòng chờ xử lý xong để tiếp tục đề xuất game mới.`);
      return;
    }

    if (!title.trim()) {
      setFormError('Vui lòng điền tên game Visual Novel yêu cầu.');
      return;
    }

    setSubmitting(true);
    const token = localStorage.getItem('therum_token');
    if (!token) {
      setFormError('Xác thực thất bại, thử đăng nhập lại.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          originalName: originalName.trim(),
          description: description.trim(),
          platforms
        })
      });

      if (res.ok) {
        // Clear forms
        setTitle('');
        setOriginalName('');
        setDescription('');
        setPlatforms(['Windows']);
        setIsFormOpen(false);
        // Refresh items list
        fetchRequests();
      } else {
        const errData = await res.json();
        setFormError(errData.error || 'Có lỗi xảy ra khi gửi yêu cầu.');
      }
    } catch {
      setFormError('Không thể gửi yêu cầu vì lỗi kết nối.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Đã duyệt':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Đang tiến hành':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse';
      case 'Đã hoàn thành':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Chờ duyệt':
      default:
        return 'bg-zinc-500/15 text-zinc-400 border border-white/5';
    }
  };

  const availablePlatforms = ['Windows', 'Android', 'macOS', 'iOS', 'WebHTML5'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" id="game-requests-section">

      {/* Visual Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-full text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Yêu cầu dự án mới</span>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
          Đề Xuất & Bình Chọn Game Lọ
        </h2>
        <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
          Cộng đồng TheRum sẽ tiếp nhận danh sách các tựa game được đề cử nhiều nhất và ưu tiên thực hiện Việt hóa dựa trên số lượt bình chọn. (Hoặc không).
        </p>
      </div>

      {activeUserRequest && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-400 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>
            Bạn đã gửi một yêu cầu đề cử là <strong>"{activeUserRequest.title}"</strong> ({activeUserRequest.status}). Vui lòng chờ nhóm dịch chuyển sang <strong>"Đang tiến hành"</strong> hoặc <strong>"Đã hoàn thành"</strong> để được gửi thêm yêu cầu mới!
          </span>
        </div>
      )}

      {/* Primary Action controls */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest font-mono">
            Tất cả đề xuất ({requests.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!user) {
              onTriggerLogin();
            } else if (activeUserRequest) {
              alert(`Bạn đã có yêu cầu "${activeUserRequest.title}" đang ở trạng thái "${activeUserRequest.status}". Vui lòng chờ nhóm dịch duyệt và tiến hành để có thể gửi tiếp yêu cầu mới!`);
            } else {
              setIsFormOpen(!isFormOpen);
            }
          }}
          className={`flex items-center gap-1.5 px-4 py-2 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer ${activeUserRequest
              ? 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed shadow-none'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/15'
            }`}
        >
          <Plus className="w-4 h-4 text-black stroke-[3]" />
          <span>Gửi đề xuất mới</span>
        </button>
      </div>

      {/* Submission Form Section */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="p-6 bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl space-y-4 shadow-xl"
            >
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4 text-emerald-450" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Phiếu Đề Xuất Dịch Game</h4>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-500 mb-1.5">
                    Tên Game (Phiên bản tiếng Việt ước mong) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Căn Nhà Ở Fata Morgana"
                    className="w-full text-xs font-sans px-3 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-500 mb-1.5">
                    Tên Gốc / Tên Tiếng Anh (Nếu có)
                  </label>
                  <input
                    type="text"
                    value={originalName}
                    onChange={(e) => setOriginalName(e.target.value)}
                    placeholder="Ví dụ: The House in Fata Morgana"
                    className="w-full text-xs font-sans px-3 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white transition-all shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-500 mb-1.5">
                  Thiết bị mong muốn hỗ trợ (Platforms)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map(plat => {
                    const isSelected = platforms.includes(plat);
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => handlePlatformToggle(plat)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${isSelected
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-extrabold'
                            : 'bg-zinc-950/25 text-zinc-450 border-white/5 hover:text-zinc-200'
                          }`}
                      >
                        {plat === 'Windows' || plat === 'macOS' ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                        <span>{plat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider font-bold text-zinc-500 mb-1.5">
                  Lý do đề xuất / Giới thiệu sơ lược
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu sơ lược giúp nhóm dịch nắm được lý do tại sao tựa game này hấp dẫn..."
                  className="w-full text-xs font-sans px-3 py-2.5 bg-zinc-950/40 border border-white/10 rounded-xl outline-none focus:border-emerald-500/50 text-white transition-all shadow-inner resize-none min-h-[80px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi đề cập ngay'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Lists Section */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto text-center" />
          <p className="text-xs text-zinc-500 font-medium">Đang kết nối trung tâm dữ liệu...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-16 text-center border border-white/5 bg-zinc-900/10 rounded-2xl max-w-xl mx-auto space-y-3">
          <HelpCircle className="w-10 h-10 text-zinc-650 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-300">Chưa có đề xuất nào được gửi</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Hãy là người tiên phong đề cử tựa game Visual Novel đầu tiên mà bạn mong muốn được thưởng thức trọn vẹn bằng tiếng Việt!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, index) => {
            const upvotesCount = req.votes?.length || 0;
            const hasVoted = user && req.votes?.includes(user.id);

            return (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="group relative p-5 bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/20 hover:bg-zinc-900/60 transition-all shadow"
              >
                {/* Ranking order badge */}
                <div className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono text-zinc-500 group-hover:border-emerald-500/30 group-hover:text-emerald-450 transition-colors">
                  #{index + 1}
                </div>

                {/* Left side: Request metadata & Descriptions */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 group-hover:text-emerald-400 transition-colors">
                      {req.title}
                    </h3>
                    {req.originalName && (
                      <span className="text-[11px] text-zinc-500 font-mono italic">
                        ({req.originalName})
                      </span>
                    )}
                  </div>

                  {req.description && (
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed max-w-xl">
                      {req.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-600" />
                      <span>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>

                    <span>•</span>

                    <span>Đề cử bởi: <strong className="text-zinc-350">{req.username}</strong></span>

                    <span>•</span>

                    {/* Platforms lists */}
                    <div className="flex items-center gap-1.5">
                      {req.platforms?.map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[9px] border border-white/5">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side: Interactivity upvotes & Admin controls */}
                <div className="flex items-center gap-3 self-end md:self-center shrink-0">

                  {/* Status Badge */}
                  <div className="relative">
                    {user?.role === 'admin' ? (
                      <select
                        value={req.status}
                        disabled={updatingId === req.id}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        className={`text-[10px] font-bold font-mono py-1 px-2.5 rounded-xl cursor-all-scroll bg-zinc-950 border transition-all ${getStatusStyle(req.status)}`}
                      >
                        <option value="Chờ duyệt">Chờ duyệt</option>
                        <option value="Đã duyệt">Đã duyệt</option>
                        <option value="Đang tiến hành">Đang tiến hành</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                      </select>
                    ) : (
                      <span className={`text-[10px] font-bold font-mono py-1 px-2.5 rounded-xl block leading-none ${getStatusStyle(req.status)}`}>
                        {req.status}
                      </span>
                    )}
                  </div>

                  {/* Vote Upvote interactive button */}
                  <button
                    type="button"
                    onClick={() => handleVote(req.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${hasVoted
                        ? 'bg-emerald-500 text-black border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-zinc-950/40 text-zinc-400 hover:text-white border-white/5 hover:border-white/10'
                      }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-black text-black' : 'text-zinc-500'}`} />
                    <span className="font-mono text-xs">{upvotesCount}</span>
                  </button>

                  {/* Admin Trash/Delete controls */}
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(req.id)}
                      disabled={updatingId === req.id}
                      className="p-1.5 text-zinc-550 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/5 rounded-xl transition-all cursor-pointer"
                      title="Xóa yêu cầu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                </div>
              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
