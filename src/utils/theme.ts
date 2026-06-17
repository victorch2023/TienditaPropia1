import type { CSSProperties } from 'react'
import type { StoreConfig } from '../types'
import { toDirectImageUrl } from './driveImageUrl'

/** CSS variables de marca a partir de la configuración de la tienda */
export function getStoreThemeStyle(config: StoreConfig): CSSProperties {
  const style: Record<string, string> = {}
  if (config.primaryColor) style['--brand-600'] = config.primaryColor
  if (config.primaryDark) style['--brand-700'] = config.primaryDark
  if (config.accentColor) style['--brand-500'] = config.accentColor
  return style as CSSProperties
}

export function getStoreBackgroundStyle(config: StoreConfig): CSSProperties | undefined {
  if (!config.backgroundImageUrl?.trim()) return undefined
  return {
    backgroundImage: `url(${toDirectImageUrl(config.backgroundImageUrl)})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
  }
}
