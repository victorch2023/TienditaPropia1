/** Hostname → storeId for custom domains (GitHub Pages). */
export const DOMAIN_STORE_MAP: Record<string, string> = {
  'citroleaf.com': 'citroleaf',
  'www.citroleaf.com': 'citroleaf',
}

/** Default repo path on github.io / Vite dev (without trailing slash). */
export const GITHUB_PAGES_BASE = '/TienditaPropia1'

/** Project-pages repo that serves multi-tienda without Citroleaf CNAME. */
export const GITHUB_PAGES_STORES_BASE = '/TienditaPropia-stores'

export function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/\.$/, '')
}

/** Hosts that serve the SPA at site root (basename `/`). */
export function isRootServedHostname(hostname?: string): boolean {
  const host = normalizeHostname(
    hostname ??
      (typeof window !== 'undefined' ? window.location.hostname : ''),
  )
  if (!host) return false
  if (getStoreIdFromHostname(host) != null) return true
  if (host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) return true
  return false
}

/**
 * First path segment on github.io project pages, e.g. /TienditaPropia-stores/…
 * Returns null for user/org site root or unknown hosts.
 */
export function getGithubPagesProjectBase(hostname?: string, pathname?: string): string | null {
  const host = normalizeHostname(
    hostname ??
      (typeof window !== 'undefined' ? window.location.hostname : ''),
  )
  if (!host.endsWith('.github.io')) return null
  const path =
    pathname ??
    (typeof window !== 'undefined' ? window.location.pathname : '')
  const seg = path.split('/').filter(Boolean)[0]
  return seg ? `/${seg}` : null
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
 * - Custom domain / Firebase Hosting (site root) → `/`
 * - github.io project pages → `/{repo}` (TienditaPropia1 or TienditaPropia-stores)
 * - local Vite → `/TienditaPropia1`
 */
export function getRouterBasename(hostname?: string): string {
  if (isRootServedHostname(hostname)) return '/'
  const project = getGithubPagesProjectBase(hostname)
  if (project) return project
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
