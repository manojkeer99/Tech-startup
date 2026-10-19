/**
 * Central API client for THE CREATORS.
 *
 * Configured with environment-based URL resolution:
 * - When VITE_API_BASE_URL is provided (e.g. separate Vercel frontend pointing to Render backend),
 *   requests are routed directly to that base origin.
 * - Otherwise, relative paths (/api/...) are used, which are handled by the Vite dev proxy
 *   in development and same-origin or reverse-proxy in production.
 */

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown>;

  constructor(status: number, message: string, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// In Vite, client env vars are exposed on import.meta.env and prefixed with VITE_
const ENV_API_BASE = typeof import.meta !== 'undefined' && import.meta.env
  ? (import.meta.env.VITE_API_BASE_URL as string | undefined)
  : undefined;

export const API_BASE_URL = (ENV_API_BASE || '').replace(/\/$/, '');

export function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (API_BASE_URL) {
    return `${API_BASE_URL}${cleanPath}`;
  }
  return cleanPath;
}

export async function api<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = buildApiUrl(path);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  if (init?.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    credentials: 'include', // Enforce secure cookie transmission for auth sessions
    ...init,
    headers,
  });

  let data: Record<string, unknown> = {};
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = (await res.json()) as Record<string, unknown>;
    } catch {
      data = {};
    }
  } else {
    const text = await res.text().catch(() => '');
    data = { rawText: text };
  }

  if (!res.ok) {
    const msg =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }

  return data as T;
}

export * from './admin-api';
