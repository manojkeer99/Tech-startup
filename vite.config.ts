import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

function cleanPublicKey(value?: string): string {
  if (!value) return '';
  return value.trim().replace(/^['"]+|['"]+$/g, '').trim();
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resolvedTurnstileSiteKey = cleanPublicKey(
    process.env.VITE_TURNSTILE_SITE_KEY ||
      process.env.TURNSTILE_SITE_KEY ||
      env.VITE_TURNSTILE_SITE_KEY ||
      env.TURNSTILE_SITE_KEY ||
      ''
  );

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'TURNSTILE_SITE_'],
    define: {
      'import.meta.env.VITE_TURNSTILE_SITE_KEY': JSON.stringify(resolvedTurnstileSiteKey),
      'import.meta.env.TURNSTILE_SITE_KEY': JSON.stringify(resolvedTurnstileSiteKey),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

