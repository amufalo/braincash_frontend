/**
 * Base path for static assets (logos, bandeiras, logos-list.json).
 * Use when app is served from subpath (e.g. /app) behind reverse proxy.
 */
export function getPublicPath(): string {
  if (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__?.BASE_PATH) {
    const base = window.__RUNTIME_CONFIG__.BASE_PATH;
    return typeof base === 'string' ? base.replace(/\/$/, '') : '';
  }
  const viteBase = import.meta.env.BASE_URL;
  return typeof viteBase === 'string' ? viteBase.replace(/\/$/, '') : '';
}

/** URL for logos-list.json (used by Accounts and Cards). */
export function getLogosListUrl(): string {
  const base = getPublicPath();
  return `${base}/logos-list.json`.replace(/\/+/g, '/');
}

/** Base path for /logos/ directory (used by logo-picker and resolveLogoPath). */
export function getLogosBasePath(): string {
  const base = getPublicPath();
  return `${base}/logos`.replace(/\/+/g, '/');
}
