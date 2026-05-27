import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, animate } from 'motion/react';
import { Shield, CheckCircle2, ArrowRight } from 'lucide-react';

interface CaptchaWidgetProps {
  onVerify: (verified: boolean) => void;
  resetKey?: number;
}

export default function CaptchaWidget({ onVerify, resetKey = 0 }: CaptchaWidgetProps) {
  const [verified, setVerified] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [maxDrag, setMaxDrag] = useState(0);

  const x = useMotionValue(0);

  // Compute maximum drag distance based on track width minus handle width
  const updateMaxDrag = () => {
    if (containerRef.current && handleRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const handleWidth = handleRef.current.clientWidth;
      // Allow 4px margin (2px left, 2px right)
      setMaxDrag(Math.max(0, containerWidth - handleWidth - 4));
    }
  };

  useEffect(() => {
    updateMaxDrag();
    // Recalculate on window resize
    window.addEventListener('resize', updateMaxDrag);
    return () => window.removeEventListener('resize', updateMaxDrag);
  }, [verified]);

  // Reset widget when resetKey or verification status changes
  useEffect(() => {
    x.set(0);
    setDragProgress(0);
    setVerified(false);
    onVerify(false);
    // Give browser a tick to render and update max drag
    setTimeout(updateMaxDrag, 50);
  }, [resetKey]);

  // Listen to motion value to compute drag progress percentage
  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      if (maxDrag > 0) {
        setDragProgress(Math.min(1, Math.max(0, latest / maxDrag)));
      }
    });
    return () => unsubscribe();
  }, [maxDrag, x]);

  const handleDragEnd = () => {
    if (verified) return;
    const currentX = x.get();
    // Verify if dragged to at least 95% of the track
    if (currentX >= maxDrag * 0.95) {
      animate(x, maxDrag, { type: 'spring', stiffness: 400, damping: 30 });
      setVerified(true);
      onVerify(true);
    } else {
      // Snap back to 0
      animate(x, 0, { type: 'spring', stiffness: 350, damping: 25 });
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block">
        Xác thực bảo mật (CAPTCHA)
      </label>
      
      <div 
        ref={containerRef}
        id="captcha-track"
        className={`relative w-full h-11 rounded-xl border select-none overflow-hidden flex items-center justify-center transition-all duration-300 ${
          verified 
            ? 'bg-emerald-500/10 border-emerald-500/30' 
            : 'bg-zinc-900/60 border-white/5 hover:border-white/10'
        }`}
      >
        {/* Fill color indicating drag progress */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" 
          style={{ width: `${dragProgress * 100}%` }}
        />

        {/* Informative placeholder text */}
        <span 
          className={`absolute text-xs font-semibold pointer-events-none transition-all duration-200 select-none ${
            verified ? 'text-emerald-450 font-bold' : 'text-zinc-500'
          }`}
          style={{ opacity: verified ? 1 : 1 - dragProgress * 1.5 }}
        >
          {verified ? (
            <span className="flex items-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đã xác thực tôi là con người
            </span>
          ) : (
            'Kéo thanh trượt để xác minh'
          )}
        </span>

        {/* Drag handle */}
        {!verified ? (
          <motion.div
            ref={handleRef}
            drag="x"
            dragConstraints={{ left: 0, right: maxDrag }}
            dragElastic={0}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
            style={{ x }}
            className="absolute left-[2px] top-[2px] bottom-[2px] w-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg border border-white/10 flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors shadow-sm select-none z-10"
          >
            <Shield className="w-4 h-4" />
          </motion.div>
        ) : (
          <div className="absolute right-[2px] top-[2px] bottom-[2px] w-9 bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center shadow-md select-none z-10">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
