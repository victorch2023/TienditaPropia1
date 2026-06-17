import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { DemoBanner } from './DemoBanner'
import { useStoreConfig } from '../hooks/useStoreConfig'
import { getStoreBackgroundStyle, getStoreThemeStyle } from '../utils/theme'

export function StoreLayout() {
  const { config } = useStoreConfig()
  const themeStyle = getStoreThemeStyle(config)
  const backgroundStyle = getStoreBackgroundStyle(config)
  const hasBackground = Boolean(config.backgroundImageUrl?.trim())

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
