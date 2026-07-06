import React, { useEffect, useRef, useState } from 'react';

// Declare Turnstile global functions for TypeScript safety
declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface CaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  resetKey?: number;
}

export default function CaptchaWidget({ onVerify, resetKey = 0 }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use fallback developer/testing key if site key is not defined in env
  const siteKey = import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

  useEffect(() => {
    // Dynamic script injection: load the script only when the widget is mounted
    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]') as HTMLScriptElement | null;
    if (!script) {
      const newScript = document.createElement('script');
      newScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      newScript.async = true;
      newScript.defer = true;
      document.body.appendChild(newScript);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const renderTurnstile = () => {
      if (!containerRef.current || !window.turnstile) return;

      try {
        // Clear any previous widget instance
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {
            // Ignored
          }
          widgetIdRef.current = null;
        }

        const widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: 'dark',
          callback: (token: string) => {
            if (active) {
              setError(null);
              onVerify(token);
            }
          },
          'expired-callback': () => {
            if (active) {
              onVerify(null);
            }
          },
          'error-callback': (err: any) => {
            console.error('Turnstile widget error:', err);
            if (active) {
              setError('Xác thực Turnstile thất bại. Vui lòng tải lại.');
              onVerify(null);
            }
          }
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('Failed to render Turnstile:', err);
      }
    };

    // Polling mechanism to wait for the window.turnstile global object to be loaded
    let interval: any = null;
    if (window.turnstile) {
      renderTurnstile();
    } else {
      interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval);
          renderTurnstile();
        }
      }, 100);
    }

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {
          // Ignored
        }
      }
    };
  }, [resetKey, siteKey]);

  return (
    <div className="space-y-1.5 w-full flex flex-col items-center">
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-center w-full">
        Xác thực bảo mật (CAPTCHA)
      </label>
      
      <div 
        ref={containerRef}
        id="captcha-turnstile-container"
        className="w-full flex justify-center py-1 min-h-[65px]"
      />

      {error && (
        <span className="text-[11px] font-semibold text-red-400 text-center block">
          {error}
        </span>
      )}
    </div>
  );
}
