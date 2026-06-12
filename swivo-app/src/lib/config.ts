/*
  Resolve the WordPress REST base URL.

  Dev:  no VITE_WP_API_URL needed — Vite proxies /wp-json to the WP host (see
        vite.config.ts), so we keep the relative path.
  Prod: SPA is served from a different origin (CDN, static host). Use the
        absolute URL configured in VITE_WP_API_URL so fetches reach the WP
        backend. The WP plugin's CORS allow-list must include the SPA origin
        (Settings → Swivo → Origines CORS supplémentaires).
*/
export function apiBase(): string {
  if (import.meta.env.DEV) return '/wp-json';
  const url = (import.meta.env.VITE_WP_API_URL || '').replace(/\/$/, '');
  return url ? `${url}/wp-json` : '/wp-json';
}
