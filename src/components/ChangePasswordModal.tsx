import React, { useState } from 'react';
import { X, Lock, KeyRound, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import CaptchaWidget from './CaptchaWidget';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  if (!isOpen) return null;

  const handleResetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaResetKey(prev => prev + 1);
  };

  const handleReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
    handleResetCaptcha();
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!captchaToken) {
      setError('Vui lòng hoàn thành xác thực robot');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Vui lòng điền đầy đủ tất cả các trường');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      handleResetCaptcha();
      return;
    }

    if (newPassword.length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự');
      handleResetCaptcha();
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('therum_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          captchaVerified: captchaToken
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đã có lỗi xảy ra');
      }

      setSuccess(data.message || 'Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      handleResetCaptcha();

      // Auto close after 2 seconds on success
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Lỗi kết nối máy chủ');
      handleResetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="change-password-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div id="change-password-modal" className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/85 backdrop-blur-md text-[#fafafa] shadow-2xl relative shadow-black/80">
        
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-amber-500 shadow-md shadow-amber-500/50" />

        {/* Close Button */}
        <button 
          id="close-change-password-btn"
          onClick={handleClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors p-1.5 bg-zinc-900 border border-white/5 rounded-lg hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Body */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
            </div>
            <h2 id="change-password-title" className="text-lg font-bold font-sans tracking-tight text-white flex items-center gap-1.5 justify-center">
              <span>Đổi Mật Khẩu</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
          </div>

          {error && (
            <div id="change-pw-error" className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-red-950/40 border border-red-900/40 text-red-200 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-405 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div id="change-pw-success" className="flex items-start gap-2.5 p-3.5 mb-5 rounded-lg bg-emerald-950/40 border border-emerald-900/40 text-emerald-200 text-sm">
              <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Mật khẩu hiện tại</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="current-password-input"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Mật khẩu mới</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="new-password-input"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 4 ký tự)..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  id="confirm-password-input"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/60 backdrop-blur-sm border border-white/5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 rounded-xl outline-none placeholder:text-zinc-650 transition-all font-sans text-sm text-zinc-200"
                />
              </div>
            </div>

            {/* Captcha */}
            <CaptchaWidget 
              onVerify={setCaptchaToken}
              resetKey={captchaResetKey}
            />

            <button
              id="change-password-submit-btn"
              type="submit"
              disabled={loading || !captchaToken}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-800 disabled:cursor-not-allowed text-slate-950 font-bold font-sans rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-500/25 transition-all text-sm mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Xác Nhận Đổi Mật Khẩu</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
