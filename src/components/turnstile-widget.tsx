import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './theme-toggle';
import { IconShield } from './icons';
import { api } from '@/lib/api';

declare global {
  interface Window {
    __cfTurnstileOnLoad?: () => void;
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          action?: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          appearance?: 'always' | 'execute' | 'interaction-only';
          retry?: 'auto' | 'never';
          'retry-interval'?: number;
          'refresh-expired'?: 'auto' | 'manual' | 'never';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
          'error-callback'?: (errorCode?: string | number) => boolean | void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

export interface TurnstileConfigState {
  enabled: boolean;
  required: boolean;
  misconfigured: boolean;
  mode: 'enforced' | 'misconfigured' | 'unconfigured-production' | 'development-bypass';
  lastErrorCode?: string | null;
}

interface TurnstileWidgetProps {
  action?: string;
  resetKey?: number;
  onVerify: (token: string | null) => void;
  onConfigChange?: (config: TurnstileConfigState) => void;
}

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-api-script';
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__cfTurnstileOnLoad';

const scriptLoadWaiters = new Set<() => void>();
const reportedErrorCodes = new Set<string>();

function sanitizePublicKey(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^['"]+|['"]+$/g, '').trim();
  return cleaned || null;
}

function describeTurnstileError(errorCode: string, hostname: string): {
  title: string;
  detail: string;
  isPermanentConfigError: boolean;
} {
  const code = errorCode.trim();

  if (code === '110200') {
    return {
      title: `Domain Not Authorized in Cloudflare Turnstile (Error ${code})`,
      detail: `The current hostname "${hostname}" is not authorized for this Turnstile widget. Add "${hostname}" under Cloudflare Dashboard → Turnstile → Widget Settings → Hostname Management.`,
      isPermanentConfigError: true,
    };
  }

  if (code === '110100' || code === '110110' || code === '400020' || code === '400070') {
    return {
      title: `Invalid or Inactive Turnstile Site Key (Error ${code})`,
      detail:
        'Verify that TURNSTILE_SITE_KEY / VITE_TURNSTILE_SITE_KEY matches an active Cloudflare Turnstile widget Site Key.',
      isPermanentConfigError: true,
    };
  }

  if (code === '110420' || code === '110430') {
    return {
      title: `Invalid Turnstile Challenge Parameter (Error ${code})`,
      detail: 'The widget action or challenge configuration format was rejected by Cloudflare.',
      isPermanentConfigError: true,
    };
  }

  if (code === '110500') {
    return {
      title: `Unsupported Browser Environment (Error ${code})`,
      detail: 'Please update your browser or disable strict script blockers for challenges.cloudflare.com.',
      isPermanentConfigError: false,
    };
  }

  if (code === '110600' || code === '110620') {
    return {
      title: `Security Verification Timed Out (Error ${code})`,
      detail: 'The verification challenge timed out. Please click Retry to complete the check.',
      isPermanentConfigError: false,
    };
  }

  if (code === '200010' || code === '200100') {
    return {
      title: `Verification Clock or Cache Error (Error ${code})`,
      detail: 'Please ensure your device clock is accurate and click Retry.',
      isPermanentConfigError: false,
    };
  }

  if (code.startsWith('300') || code.startsWith('600')) {
    return {
      title: `Security Challenge Interrupted (Error ${code})`,
      detail:
        'The Cloudflare challenge could not complete (this can happen if a browser extension blocks challenges.cloudflare.com or in a restricted preview frame). Please click Retry.',
      isPermanentConfigError: false,
    };
  }

  return {
    title: `Security Verification Error (Code: ${code || 'unknown'})`,
    detail: 'Security verification encountered an error. Please click Retry to try again.',
    isPermanentConfigError: false,
  };
}

function reportClientDiagnostic(errorCode: string, action: string, hostname: string) {
  const dedupeKey = `${errorCode}:${action}:${hostname}`;
  if (reportedErrorCodes.has(dedupeKey)) return;
  reportedErrorCodes.add(dedupeKey);

  // Never send or log tokens or secrets—only symbolic error code, action, and public hostname
  api('/api/auth/turnstile-diagnostic', {
    method: 'POST',
    body: JSON.stringify({ errorCode, action, hostname }),
  }).catch(() => {
    // Ignore diagnostic reporting network errors
  });
}

export function TurnstileWidget({
  action = 'auth',
  resetKey = 0,
  onVerify,
  onConfigChange,
}: TurnstileWidgetProps) {
  const { resolvedTheme } = useTheme();

  const envSiteKey = (() => {
    if (typeof import.meta === 'undefined' || !import.meta.env) return null;
    return (
      sanitizePublicKey(import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ||
      sanitizePublicKey(import.meta.env.TURNSTILE_SITE_KEY as string | undefined) ||
      null
    );
  })();

  const [siteKey, setSiteKey] = useState<string | null>(envSiteKey);
  const [configChecked, setConfigChecked] = useState<boolean>(false);
  const [configState, setConfigState] = useState<TurnstileConfigState>({
    enabled: Boolean(envSiteKey),
    required: Boolean(envSiteKey),
    misconfigured: false,
    mode: envSiteKey ? 'enforced' : 'development-bypass',
    lastErrorCode: null,
  });
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(() =>
    typeof window !== 'undefined' && Boolean(window.turnstile?.render)
  );
  const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'expired' | 'error'>('loading');
  const [errorInfo, setErrorInfo] = useState<{
    code: string;
    title: string;
    detail: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const mountedKeyRef = useRef<string | null>(null);
  const autoRetryCountRef = useRef<number>(0);
  const autoRetryTimerRef = useRef<number | null>(null);
  const initialThemeRef = useRef<'light' | 'dark'>(resolvedTheme === 'light' ? 'light' : 'dark');

  const onVerifyRef = useRef(onVerify);
  const onConfigChangeRef = useRef(onConfigChange);
  onVerifyRef.current = onVerify;
  onConfigChangeRef.current = onConfigChange;

  // 1. Fetch authoritative Turnstile configuration from backend
  useEffect(() => {
    let mounted = true;
    async function fetchConfig() {
      try {
        const res = await api<{
          ok: boolean;
          turnstileSiteKey?: string | null;
          turnstileEnabled?: boolean;
          turnstileRequired?: boolean;
          turnstileMode?: TurnstileConfigState['mode'];
        }>('/api/auth/config');

        if (!mounted) return;

        const serverSiteKey = sanitizePublicKey(res?.turnstileSiteKey);
        const resolvedKey = serverSiteKey || envSiteKey || null;
        const mode: TurnstileConfigState['mode'] =
          res?.turnstileMode || (resolvedKey ? 'enforced' : 'development-bypass');
        const misconfigured = mode === 'misconfigured';
        const enabled = Boolean(resolvedKey) && !misconfigured;
        const required = Boolean(res?.turnstileRequired ?? enabled);

        setSiteKey(resolvedKey);

        const nextConfig: TurnstileConfigState = {
          enabled,
          required,
          misconfigured,
          mode,
          lastErrorCode: null,
        };
        setConfigState(nextConfig);
        setConfigChecked(true);
        onConfigChangeRef.current?.(nextConfig);
      } catch {
        if (!mounted) return;
        const nextConfig: TurnstileConfigState = {
          enabled: Boolean(envSiteKey),
          required: Boolean(envSiteKey),
          misconfigured: false,
          mode: envSiteKey ? 'enforced' : 'development-bypass',
          lastErrorCode: null,
        };
        setConfigState(nextConfig);
        setConfigChecked(true);
        onConfigChangeRef.current?.(nextConfig);
      }
    }

    fetchConfig();
    return () => {
      mounted = false;
    };
  }, [envSiteKey]);

  // 2. Load official Cloudflare Turnstile script when a siteKey is configured
  useEffect(() => {
    if (!siteKey || typeof window === 'undefined') return;

    if (window.turnstile?.render) {
      setScriptLoaded(true);
      return;
    }

    const onReady = () => {
      if (window.turnstile?.render) {
        setScriptLoaded(true);
      }
    };

    scriptLoadWaiters.add(onReady);

    window.__cfTurnstileOnLoad = () => {
      scriptLoadWaiters.forEach((fn) => fn());
    };

    const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleError = () => {
      setStatus('error');
      setErrorInfo({
        code: 'SCRIPT_BLOCKED',
        title: 'Unable to Load Cloudflare Turnstile Script',
        detail:
          'Could not load https://challenges.cloudflare.com/turnstile/v0/api.js. Please check your network connection or disable ad/script blockers.',
      });
      onVerifyRef.current(null);
    };

    if (existing) {
      existing.addEventListener('load', onReady);
      existing.addEventListener('error', handleError);
      return () => {
        scriptLoadWaiters.delete(onReady);
        existing.removeEventListener('load', onReady);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = handleError;
    document.head.appendChild(script);

    return () => {
      scriptLoadWaiters.delete(onReady);
    };
  }, [siteKey]);

  // 3. Render the Turnstile widget (guarded against duplicate initialization)
  const renderWidget = useCallback(
    (forceRecreate = false) => {
      if (
        !configChecked ||
        !siteKey ||
        !scriptLoaded ||
        typeof window === 'undefined' ||
        !window.turnstile?.render ||
        !containerRef.current
      ) {
        return;
      }

      const targetMountKey = `${siteKey}:${action}`;
      if (!forceRecreate && widgetIdRef.current && mountedKeyRef.current === targetMountKey) {
        return;
      }

      if (autoRetryTimerRef.current) {
        window.clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }

      try {
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore cleanup errors on stale widget ID
          }
          widgetIdRef.current = null;
          mountedKeyRef.current = null;
        }

        containerRef.current.innerHTML = '';
        setStatus('ready');
        setErrorInfo(null);
        onVerifyRef.current(null);

        const availableWidth = wrapperRef.current?.clientWidth || 340;
        const widgetSize: 'compact' | 'normal' = availableWidth < 310 ? 'compact' : 'normal';
        const SafeAction = action.replace(/[^a-zA-Z0-9_-]/g, '') || 'auth';

        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action: SafeAction,
          theme: initialThemeRef.current,
          size: widgetSize,
          appearance: 'always',
          retry: 'auto',
          'retry-interval': 2500,
          'refresh-expired': 'auto',
          callback: (token: string) => {
            if (token && token.trim()) {
              autoRetryCountRef.current = 0;
              setStatus('verified');
              setErrorInfo(null);
              onVerifyRef.current(token.trim());
            }
          },
          'expired-callback': () => {
            setStatus('expired');
            setErrorInfo({
              code: 'EXPIRED',
              title: 'Security Verification Expired',
              detail: 'Your security token expired. Please click Retry to verify again.',
            });
            onVerifyRef.current(null);
          },
          'timeout-callback': () => {
            setStatus('expired');
            setErrorInfo({
              code: '110600',
              title: 'Security Verification Timed Out (Error 110600)',
              detail: 'The challenge timed out. Please click Retry to continue.',
            });
            onVerifyRef.current(null);
          },
          'error-callback': (rawErrorCode?: string | number) => {
            const code = rawErrorCode !== undefined && rawErrorCode !== null ? String(rawErrorCode).trim() : 'unknown';
            const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
            const described = describeTurnstileError(code, hostname);

            console.warn(
              `[Turnstile] Widget error code: ${code} (hostname: ${hostname}, action: ${SafeAction})`
            );
            reportClientDiagnostic(code, SafeAction, hostname);

            // Auto-retry once on transient client/challenge errors (300xxx / 600xxx)
            if (
              !described.isPermanentConfigError &&
              (code.startsWith('300') || code.startsWith('600')) &&
              autoRetryCountRef.current < 1
            ) {
              autoRetryCountRef.current += 1;
              autoRetryTimerRef.current = window.setTimeout(() => {
                if (widgetIdRef.current && window.turnstile) {
                  try {
                    window.turnstile.reset(widgetIdRef.current);
                    return;
                  } catch {
                    // Fall through to full error display
                  }
                }
              }, 900);
            }

            setStatus('error');
            setErrorInfo({
              code,
              title: described.title,
              detail: described.detail,
            });
            onVerifyRef.current(null);
          },
        });

        widgetIdRef.current = id;
        mountedKeyRef.current = targetMountKey;
      } catch {
        setStatus('error');
        setErrorInfo({
          code: 'INIT_ERROR',
          title: 'Security Challenge Initialization Failed',
          detail: 'Could not initialize the Cloudflare Turnstile widget. Please click Retry.',
        });
        onVerifyRef.current(null);
      }
    },
    [configChecked, siteKey, scriptLoaded, action]
  );

  useEffect(() => {
    if (!configChecked || !siteKey || !scriptLoaded) return;
    renderWidget(false);
  }, [configChecked, siteKey, scriptLoaded, renderWidget]);

  // Clean up widget only on component unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimerRef.current) {
        window.clearTimeout(autoRetryTimerRef.current);
      }
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore unmount removal errors
        }
        widgetIdRef.current = null;
        mountedKeyRef.current = null;
      }
    };
  }, []);

  // 4. Reset widget when parent increments resetKey (e.g., after failed submit)
  useEffect(() => {
    if (resetKey === 0) return;
    onVerifyRef.current(null);
    setErrorInfo(null);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        setStatus('ready');
        return;
      } catch {
        // Fallback to full recreate
      }
    }
    renderWidget(true);
  }, [resetKey, renderWidget]);

  const handleRetry = () => {
    autoRetryCountRef.current = 0;
    onVerifyRef.current(null);
    setErrorInfo(null);
    setStatus('ready');
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
        return;
      } catch {
        // Fallback to full recreate
      }
    }
    renderWidget(true);
  };

  if (!configChecked && !siteKey) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 px-3.5 py-2.5 text-xs text-[var(--color-muted)]">
        <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-[var(--color-orchid)]" />
        <span>Initializing security verification...</span>
      </div>
    );
  }

  // Misconfigured state (only one of TURNSTILE_SITE_KEY or TURNSTILE_SECRET_KEY is set)
  if (configState.misconfigured) {
    return (
      <div
        role="alert"
        className="w-full rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-300"
      >
        <div className="flex items-start gap-2">
          <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Cloudflare Turnstile Misconfigured</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-200/90">
              Both <code className="font-mono">TURNSTILE_SITE_KEY</code> and{' '}
              <code className="font-mono">TURNSTILE_SECRET_KEY</code> must be configured together on the server.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Unconfigured state (local development bypass or unconfigured environment)
  if (!siteKey) {
    if (configState.mode === 'unconfigured-production') {
      return (
        <div
          role="alert"
          className="w-full rounded-xl border border-rose-500/35 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300"
        >
          <div className="flex items-start gap-2">
            <IconShield className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <p className="font-semibold">Security Verification Unavailable</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-rose-200/90">
                Cloudflare Turnstile credentials are not configured for this environment.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div ref={wrapperRef} className="w-full space-y-2">
      <div className="relative flex w-full min-h-[72px] flex-col items-center justify-center overflow-x-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-raise)]/40 p-2">
        {(!scriptLoaded || !configChecked) && status !== 'error' && (
          <div className="flex items-center gap-2 py-3 text-xs text-[var(--color-muted)]">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-muted)] border-t-[var(--color-orchid)]" />
            <span>Loading Cloudflare Turnstile...</span>
          </div>
        )}
        <div ref={containerRef} className="mx-auto min-h-[65px] flex items-center justify-center" />
      </div>

      {(status === 'expired' || status === 'error') && errorInfo && (
        <div
          role="alert"
          className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">{errorInfo.title}</p>
              <p className="text-[11px] leading-relaxed text-amber-200/90">{errorInfo.detail}</p>
            </div>
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded-md border border-amber-400/40 bg-amber-500/20 px-2.5 py-1 text-[11px] font-semibold text-amber-100 hover:bg-amber-500/30 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
