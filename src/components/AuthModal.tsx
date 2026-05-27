import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import CaptchaWidget from './CaptchaWidget';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: { id: string; username: string; email: string; role: 'user' | 'admin'; avatarUrl?: string }, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  if (!isOpen) return null;

  const handleResetCaptcha = () => {
    setIsCaptchaVerified(false);
    setCaptchaResetKey(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isCaptchaVerified) {
      setError('Vui lòng hoàn thành xác thực robot');
      return;
    }

    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const body = isLogin 
      ? { usernameOrEmail: username || email, password, captchaVerified: isCaptchaVerified }
      : { username, email, password, captchaVerified: isCaptchaVerified };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đã có lỗi xảy ra');
      }

      onSuccess(data.user, data.token);
      handleResetCaptcha();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
      handleResetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div id="auth-modal" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md text-[#fafafa] shadow-2xl relative shadow-black/80">
        
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-emerald-500 shadow-md shadow-emerald-500/50" />

        {/* Close Button */}
        <button 
          id="close-auth-btn"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1.5 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Body */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <img src={logoUrl} alt="TheRum Logo" className="h-12 object-contain mb-3" />
            <h2 id="auth-modal-title" className="text-lg font-bold font-sans tracking-tight text-white flex items-center gap-1.5 justify-center">
              <Sparkles className="w-4 h-4 text-emerald-450" />
              <span>{isLogin ? 'Đăng nhập TheRum' : 'Tạo tài khoản mới'}</span>
            </h2>
          </div>

          {error && (
            <div id="auth-error-alert" className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-405 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="auth-form" onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Tên hiển thị</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="reg-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: therum_fan"
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                {isLogin ? 'Email hoặc Tên tài khoản' : 'Địa chỉ Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="auth-identity"
                  type={isLogin ? "text" : "email"}
                  required
                  value={isLogin && !username ? email : email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isLogin ? "Email hoặc Username..." : "example@domain.com"}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Mật khẩu</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="auth-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                />
              </div>
            </div>

            {/* Security Captcha Checkbox/Slider */}
            <CaptchaWidget 
              onVerify={setIsCaptchaVerified}
              resetKey={captchaResetKey}
            />

            <button
               id="auth-submit-btn"
              type="submit"
              disabled={loading || !isCaptchaVerified}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-450 disabled:bg-emerald-800 disabled:cursor-not-allowed text-slate-950 font-bold font-sans rounded-xl shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 transition-all text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Đăng Nhập Ngay' : 'Đăng Ký Tài Khoản'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center text-xs text-zinc-500">
            <span>{isLogin ? 'Chưa phải thành viên?' : 'Có tài khoản rồi?'}</span>
            <button
              id="toggle-auth-mode-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                handleResetCaptcha();
              }}
              className="font-semibold text-emerald-405 hover:text-emerald-300 transition-colors uppercase tracking-wider"
            >
              {isLogin ? 'Đăng Ký' : 'Đăng Nhập'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
