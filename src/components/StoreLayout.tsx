import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { DemoBanner } from './DemoBanner'
import { useStore } from '../hooks/useStore'
import { useStoreConfig } from '../hooks/useStoreConfig'
import { CITROLEAF_STORE_ID } from '../config/stores'
import { getStoreBackgroundStyle, getStoreThemeStyle } from '../utils/theme'

function isStoreHomePath(pathname: string) {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  return normalized === '/' || /\/s\/[^/]+$/.test(normalized)
}

export function StoreLayout() {
  const { storeId } = useStore()
  const { config } = useStoreConfig()
  const { pathname } = useLocation()
  const themeStyle = getStoreThemeStyle(config)
  const backgroundStyle = getStoreBackgroundStyle(config)
  const hasBackground = Boolean(config.backgroundImageUrl?.trim())
  const isCitroleaf = storeId === CITROLEAF_STORE_ID
  const isHome = isStoreHomePath(pathname)

  if (isCitroleaf) {
    return (
      <div
        className="relative flex min-h-screen flex-col bg-[#F2F0EB] font-citro-sans text-[#261F1A]"
        style={themeStyle}
      >
        <DemoBanner />
        <Header />
        {/* Home: sin padding lateral para hero a sangre; resto de rutas conserva gutter */}
        <main className={`w-full flex-1 ${isHome ? 'px-0 py-0' : 'px-4 py-6'}`}>
          <Outlet />
        </main>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50" style={themeStyle}>
      {hasBackground && (
        <>
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0"
            style={backgroundStyle}
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-0 z-0 bg-white/85"
          />
        </>
      )}
      <div className="relative z-10 flex min-h-screen flex-col">
        <DemoBanner />
        <Header />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
