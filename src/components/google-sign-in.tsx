import { useState, useEffect, useRef } from 'react';
import { useToast } from './toast';
import { store } from '@/lib/store';
import { api } from '@/lib/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            context?: string;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string | number;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; getNotDisplayedReason: () => string }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { push } = useToast();
  const [clientId, setClientId] = useState<string | null>(() => {
    return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID as string) || null;
  });
  const [configChecked, setConfigChecked] = useState(false);
  const [gisLoaded, setGisLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);
  const lastRenderedWidthRef = useRef<number>(0);
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  // 1. Fetch Google OAuth configuration from the backend
  useEffect(() => {
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await api<{ ok: boolean; googleClientId: string | null; isConfigured: boolean }>('/api/auth/config');
        if (isMounted) {
          if (res?.googleClientId) {
            setClientId(res.googleClientId);
          }
          setConfigChecked(true);
        }
      } catch {
        if (isMounted) {
          setConfigChecked(true);
        }
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dynamically load official Google Identity Services script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const scriptId = 'google-identity-services-script';
    const existing = document.getElementById(scriptId);

    if (existing) {
      existing.addEventListener('load', () => setGisLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    script.onerror = () => {
      console.warn('[Google Identity] Failed to load official GIS client library.');
    };
    document.head.appendChild(script);
  }, []);

  // 3. Initialize Google Identity Services & responsively render button with valid pixel width
  useEffect(() => {
    if (!gisLoaded || !clientId || typeof window === 'undefined' || !window.google?.accounts?.id) {
      return;
    }

    const renderGisButton = (force = false) => {
      const container = googleBtnContainerRef.current;
      const wrapper = wrapperRef.current;
      if (!container || !wrapper || !window.google?.accounts?.id) return;

      const measured = Math.floor(wrapper.getBoundingClientRect().width || wrapper.clientWidth || 320);
      // Google Identity Services requires an integer pixel width between 200 and 400
      const targetWidth = Math.min(400, Math.max(200, measured));

      if (!force && Math.abs(targetWidth - lastRenderedWidthRef.current) < 2 && container.childElementCount > 0) {
        return;
      }

      lastRenderedWidthRef.current = targetWidth;
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: targetWidth,
        logo_alignment: 'left',
      });
    };

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          if (!response?.credential) {
            push('error', 'Google authentication did not return a valid credential.');
            return;
          }

          setLoading(true);
          try {
            const result = await store.loginWithGoogleCredential(response.credential);
            if (result.success && result.user) {
              push('success', `Welcome, ${result.user.name.split(' ')[0]}! Signed in with Google.`);
              if (onSuccessRef.current) onSuccessRef.current();
            } else {
              push('error', result.error || 'Google authentication could not be completed.');
            }
          } catch (err: any) {
            push('error', err?.message || 'Network error verifying Google ID token.');
          } finally {
            setLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      renderGisButton(true);
    } catch (err) {
      console.warn('[Google Identity Init Error]:', err);
    }

    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => renderGisButton(false), 100);
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(wrapperRef.current);
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      if (observer) observer.disconnect();
      else window.removeEventListener('resize', handleResize);
    };
  }, [gisLoaded, clientId, push]);

  const handleClick = () => {
    if (loading) return;

    if (!clientId) {
      const msg = 'Google Sign-In is awaiting Google Cloud OAuth Client ID configuration. Set GOOGLE_CLIENT_ID (or VITE_GOOGLE_CLIENT_ID) in your environment variables to enable.';
      setConfigNotice(msg);
      push('error', 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID.');
      return;
    }

    if (!gisLoaded || !window.google?.accounts?.id) {
      push('error', 'Google Identity Services library is still loading. Please try again in a moment.');
      return;
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          console.info('[Google Identity] OneTap prompt not displayed:', notification.getNotDisplayedReason());
        }
      });
    } catch {
      push('error', 'Could not open Google authentication dialog.');
    }
  };

  return (
    <div className="w-full space-y-2" data-config-checked={configChecked ? 'true' : 'false'}>
      {/* Official Google Button Container (Rendered by GIS when client ID is active) */}
      {clientId && gisLoaded ? (
        <div
          ref={wrapperRef}
          className="relative flex w-full items-center justify-center min-h-[44px]"
        >
          <div
            ref={googleBtnContainerRef}
            className="flex max-w-full items-center justify-center overflow-hidden rounded-lg"
            style={{ minHeight: '40px' }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/85 backdrop-blur-xs text-xs font-medium text-slate-800">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-blue-600 mr-2" />
              Verifying Google credential...
            </div>
          )}
        </div>
      ) : (
        /* Styled branded fallback button when awaiting configuration or before GIS initializes */
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:bg-slate-100 disabled:opacity-60 cursor-pointer"
          aria-label="Sign in with Google"
        >
          {loading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          ) : (
            <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.05 13.22l7.98 6.19C11.92 13.72 17.47 9.5 24 9.5Z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.92c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.93c4.46-4.12 7.14-10.2 7.14-17.58Z" />
              <path fill="#FBBC05" d="M10.03 28.59A14.4 14.4 0 0 1 9.25 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.56 2.57 10.78l7.46-6.19Z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.87l-7.65-5.93c-2.13 1.43-4.85 2.3-8.25 2.3-6.53 0-12.08-4.22-14.07-10.09l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
            </svg>
          )}
          <span>{loading ? 'Verifying with Google...' : 'Sign in with Google'}</span>
        </button>
      )}

      {/* Helpful configuration assistance when Google OAuth is not yet configured */}
      {configNotice && !clientId && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
          <p className="font-semibold">Google Cloud OAuth Configuration Required</p>
          <p className="mt-1 text-amber-200/90 leading-relaxed">
            To enable real Google Sign-In, configure <code className="bg-black/30 px-1 py-0.5 rounded text-amber-100 font-mono">GOOGLE_CLIENT_ID</code> in your server environment and <code className="bg-black/30 px-1 py-0.5 rounded text-amber-100 font-mono">VITE_GOOGLE_CLIENT_ID</code> on the frontend.
          </p>
        </div>
      )}
    </div>
  );
}
