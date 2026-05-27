import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import logoUrl from '../../assets/logo.png';

interface AgeVerificationProps {
  onConfirm: () => void;
}

export default function AgeVerification({ onConfirm }: AgeVerificationProps) {
  const [isUnderage, setIsUnderage] = useState(false);

  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div id="age-verification-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#09090b] select-none overflow-hidden">
      
      {/* Decorative ambient background glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-950/30 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-950/20 blur-[150px] rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        {!isUnderage ? (
          <motion.div
            key="verification-card"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            id="age-verification-card"
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl text-[#fafafa] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
          >
            {/* Emerald/Red double accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500" />

            <div className="p-8 sm:p-10 flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6 flex justify-center">
                <img src={logoUrl} alt="TheRum Logo" className="h-14 object-contain" />
              </div>

              {/* Warn Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-red-550/20 blur-md rounded-full animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-950/40 border border-red-500/30 text-red-400">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              </div>

              {/* Title */}
              <h2 id="age-verify-title" className="text-xl sm:text-2xl font-black font-sans tracking-tight text-white mb-3">
                CẢNH BÁO NỘI DUNG 18+
              </h2>

              {/* Warning Content */}
              <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed mb-8">
                Trang web này chứa các tệp game Visual Novel với nội dung, ngôn từ và hình ảnh chỉ phù hợp cho người từ <strong className="text-red-450 font-bold">18 tuổi trở lên</strong>. 
                Vui lòng xác nhận độ tuổi của bạn trước khi tiếp tục.
              </p>

              {/* Actions */}
              <div className="w-full flex flex-col sm:flex-row items-center gap-3">
                <button
                  id="age-decline-btn"
                  onClick={() => setIsUnderage(true)}
                  className="w-full order-2 sm:order-1 py-3 px-5 border border-white/10 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-350 hover:text-white font-bold font-sans text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer select-none"
                >
                  Tôi chưa đủ 18 tuổi
                </button>
                <button
                  id="age-confirm-btn"
                  onClick={onConfirm}
                  className="w-full order-1 sm:order-2 py-3 px-5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black font-sans text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer select-none shadow-lg shadow-emerald-500/15 hover:shadow-emerald-500/25 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Tôi đã đủ 18 tuổi</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="underage-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            id="underage-block-card"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-red-900/30 bg-zinc-950/90 backdrop-blur-xl text-[#fafafa] shadow-2xl p-8 sm:p-10 flex flex-col items-center text-center"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-red-600/10 blur-lg rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-950/50 border border-red-500/40 text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-black font-sans tracking-tight text-white mb-3">
              TRUY CẬP BỊ TỪ CHỐI
            </h2>

            <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed mb-8">
              Rất tiếc, bạn cần phải từ <strong className="text-red-400 font-bold">18 tuổi trở lên</strong> để truy cập và trải nghiệm nội dung của cổng Visual Novel TheRum.
            </p>

            <button
              id="age-exit-btn"
              onClick={handleExit}
              className="w-full py-3 px-5 bg-red-500 hover:bg-red-400 text-white font-black font-sans text-xs uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer select-none shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Rời khỏi trang web</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
