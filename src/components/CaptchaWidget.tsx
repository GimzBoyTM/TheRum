import React, { useEffect, useRef, useState } from 'react';

// Declare grecaptcha global functions for TypeScript safety
declare global {
  interface Window {
    grecaptcha?: {
      render: (container: string | HTMLElement, options: any) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface CaptchaWidgetProps {
  onVerify: (token: string | null) => void;
  resetKey?: number;
}

export default function CaptchaWidget({ onVerify, resetKey = 0 }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use fallback developer/testing key if site key is not defined in env (Google reCAPTCHA v2 Test Key)
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  useEffect(() => {
    // Dynamic script injection: load the script only when the widget is mounted
    let script = document.querySelector('script[src*="google.com/recaptcha/api.js"]') as HTMLScriptElement | null;
    if (!script) {
      const newScript = document.createElement('script');
      newScript.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      newScript.async = true;
      newScript.defer = true;
      document.body.appendChild(newScript);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const renderRecaptcha = () => {
      if (!containerRef.current || !window.grecaptcha) return;

      try {
        // Clear any previous widget instance
        if (widgetIdRef.current !== null) {
          try {
            window.grecaptcha.reset(widgetIdRef.current);
          } catch (e) {
            // Ignored
          }
          widgetIdRef.current = null;
        }

        // Clean container
        containerRef.current.innerHTML = '';

        const widgetId = window.grecaptcha.render(containerRef.current, {
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
          'error-callback': () => {
            console.error('reCAPTCHA widget error');
            if (active) {
              setError('Xác thực reCAPTCHA thất bại. Vui lòng thử lại.');
              onVerify(null);
            }
          }
        });
        widgetIdRef.current = widgetId;
      } catch (err) {
        console.error('Failed to render reCAPTCHA:', err);
      }
    };

    // Polling mechanism to wait for the window.grecaptcha global object to be loaded
    let interval: any = null;
    if (window.grecaptcha) {
      renderRecaptcha();
    } else {
      interval = setInterval(() => {
        if (window.grecaptcha) {
          clearInterval(interval);
          renderRecaptcha();
        }
      }, 100);
    }

    return () => {
      active = false;
      if (interval) clearInterval(interval);
      if (widgetIdRef.current !== null && window.grecaptcha) {
        try {
          window.grecaptcha.reset(widgetIdRef.current);
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
        id="captcha-recaptcha-container"
        className="w-full flex justify-center py-1 min-h-[78px]"
      />

      {error && (
        <span className="text-[11px] font-semibold text-red-400 text-center block">
          {error}
        </span>
      )}
    </div>
  );
}
