/** Hostname → storeId for custom domains (GitHub Pages). */
export const DOMAIN_STORE_MAP: Record<string, string> = {
  'citroleaf.com': 'citroleaf',
  'www.citroleaf.com': 'citroleaf',
}

/** Repo path on github.io (Vite project base without trailing slash). */
export const GITHUB_PAGES_BASE = '/TienditaPropia1'

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

/**
 * Returns storeId if hostname is a mapped custom domain
 * (exact match or apex when www is mapped, and vice versa).
 */
export function getStoreIdFromHostname(hostname: string): string | null {
  const host = normalizeHostname(hostname)
  if (!host) return null

  const direct = DOMAIN_STORE_MAP[host]
  if (direct) return direct

  // Match subdomains of a mapped apex, e.g. shop.citroleaf.com → citroleaf
  // only when the apex itself is mapped.
  for (const [mappedHost, storeId] of Object.entries(DOMAIN_STORE_MAP)) {
    if (host === mappedHost) return storeId
    if (host.endsWith(`.${mappedHost}`)) return storeId
  }

  return null
}

export function isCustomDomainHostname(hostname?: string): boolean {
  const host =
    hostname ??
    (typeof window !== 'undefined' ? window.location.hostname : '')
  return getStoreIdFromHostname(host) != null
}

/**
 * React Router basename:
 * - Custom domain (GitHub Pages serves at site root) → `/`
 * - github.io / local Vite → `/TienditaPropia1`
 */
export function getRouterBasename(hostname?: string): string {
  if (isCustomDomainHostname(hostname)) return '/'
  return GITHUB_PAGES_BASE
}

/**
 * Document `<base href>` for resolving relative asset URLs from the Vite build.
 * Must stay in sync with getRouterBasename().
 */
export function getDocumentBaseHref(hostname?: string): string {
  const base = getRouterBasename(hostname)
  return base.endsWith('/') ? base : `${base}/`
}
