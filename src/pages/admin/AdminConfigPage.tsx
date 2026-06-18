import { useEffect, useState } from 'react'
import { getStoreConfig, updateStoreConfig } from '../../services/store'
import { LIMA_DISTRITOS } from '../../data/lima-distritos'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { centavosToSoles, solesToCentavos } from '../../utils/money'
import {
  DEFAULT_DRIVE_IMAGES_FOLDER_URL,
  resolveDriveImagesFolderUrl,
} from '../../constants/drive'
import { DriveImage } from '../../components/DriveImage'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import { getStoreThemeStyle } from '../../utils/theme'
import type { StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

function normalizeConfigForSave(config: StoreConfig): StoreConfig {
  return {
    ...config,
    logoUrl: config.logoUrl?.trim() ? toDirectImageUrl(config.logoUrl) : undefined,
    heroBannerUrl: config.heroBannerUrl?.trim()
      ? toDirectImageUrl(config.heroBannerUrl)
      : undefined,
    backgroundImageUrl: config.backgroundImageUrl?.trim()
      ? toDirectImageUrl(config.backgroundImageUrl)
      : undefined,
  }
}

const STOREFRONT_URL = new URL(import.meta.env.BASE_URL || '/', window.location.origin).href

export function AdminConfigPage() {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedConfigJson, setSavedConfigJson] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [driveHelpOpen, setDriveHelpOpen] = useState(false)

  useEffect(() => {
    getStoreConfig()
      .then(setConfig)
      .finally(() => setLoading(false))
  }, [])

  const showSuccessBanner =
    savedConfigJson !== null &&
    savedConfigJson === JSON.stringify(normalizeConfigForSave(config))

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const toSave = normalizeConfigForSave(config)
      await updateStoreConfig(toSave)
      setConfig(toSave)
      setSavedConfigJson(JSON.stringify(toSave))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo guardar la configuración.'
      setSaveError(message)
      setSavedConfigJson(null)
    } finally {
      setSaving(false)
    }
  }

  const updateDistritoShipping = (distrito: string, soles: string) => {
    const centavos = solesToCentavos(parseFloat(soles) || 0)
    setConfig({
      ...config,
      shippingByDistrito: {
        ...config.shippingByDistrito,
        [distrito]: centavos,
      },
    })
  }

  const updatePayments = (field: keyof StoreConfig['payments'], value: string | boolean) => {
    setConfig({
      ...config,
      payments: { ...config.payments, [field]: value },
    })
  }

  if (loading) return <LoadingSpinner />

  const driveFolderUrl = resolveDriveImagesFolderUrl(config.imageHostingNote)

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Configuración de tienda</h1>

      {showSuccessBanner && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          <p className="font-medium">✓ Configuración guardada correctamente</p>
          <p className="mt-1 text-green-700">
            Los colores y la apariencia se aplican en la{' '}
            <strong>tienda pública</strong>, no en este panel de administración.{' '}
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-green-900 underline hover:text-green-950"
            >
              Ver tienda →
            </a>
          </p>
        </div>
      )}

      {saveError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">No se pudo guardar la configuración</p>
          <p className="mt-1">{saveError}</p>
        </div>
      )}

      <details
        open={driveHelpOpen}
        onToggle={(e) => setDriveHelpOpen((e.target as HTMLDetailsElement).open)}
        className="mb-6 rounded-xl border border-brand-100 bg-brand-50 p-4"
      >
        <summary className="cursor-pointer font-medium text-brand-900">
          Cómo usar Google Drive para imágenes
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-brand-800">
          <li>Crea una carpeta en Google Drive (ej. &quot;Mi Tiendita - Imágenes&quot;).</li>
          <li>Clic derecho en la carpeta → Compartir → &quot;Cualquier persona con el enlace&quot; → Lector.</li>
          <li>Sube tus fotos de productos a esa carpeta.</li>
          <li>Abre cada imagen → Compartir → copia el enlace.</li>
          <li>
            En Productos, pega el enlace y usa el botón &quot;Drive → directo&quot; si hace falta.
          </li>
          <li>
            No necesitas Firebase Storage ni plan Blaze: las URLs se guardan en Firestore.
          </li>
        </ol>
      </details>

      <div className="space-y-4 rounded-xl border bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre de la tienda</label>
          <input
            value={config.name}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">URL del logo</label>
          <input
            value={config.logoUrl || ''}
            onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })}
            placeholder="https://drive.google.com/file/d/..."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Recomendado: 200×200 px, cuadrado, PNG con fondo transparente, máx. 500 KB.
          </p>
          {config.logoUrl?.trim() && (
            <div className="mt-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
              <DriveImage src={config.logoUrl} alt="Vista previa del logo" className="max-h-full max-w-full object-contain" />
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h2 className="mb-3 font-semibold text-gray-900">Apariencia de la tienda</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Banner de inicio (URL en Drive)
              </label>
              <input
                value={config.heroBannerUrl || ''}
                onChange={(e) => setConfig({ ...config, heroBannerUrl: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Recomendado: 1200×400 px (proporción 3:1), máx. 2 MB, JPG/PNG/WebP. Si está vacío,
                se muestra un degradado con los colores de la marca.
              </p>
              {config.heroBannerUrl?.trim() && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <DriveImage
                    src={config.heroBannerUrl}
                    alt="Vista previa del banner de inicio"
                    className="h-32 w-full object-cover"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Imagen de fondo de la tienda (opcional)
              </label>
              <input
                value={config.backgroundImageUrl || ''}
                onChange={(e) => setConfig({ ...config, backgroundImageUrl: e.target.value })}
                placeholder="https://drive.google.com/file/d/..."
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Recomendado: 1920×1080 px, imagen suave o patrón, máx. 2 MB. Se aplica con
                opacidad para mantener el texto legible.
              </p>
              {config.backgroundImageUrl?.trim() && (
                <div className="relative mt-2 overflow-hidden rounded-lg border">
                  <DriveImage
                    src={config.backgroundImageUrl}
                    alt="Vista previa del fondo"
                    className="h-24 w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-white/85" />
                </div>
              )}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Colores de la marca</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-gray-600">Color principal</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryColor || '#2563eb'}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <input
                      value={config.primaryColor || ''}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      placeholder="#2563eb"
                      className="flex-1 rounded-lg border px-2 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Color oscuro (hover)</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={config.primaryDark || '#1d4ed8'}
                      onChange={(e) => setConfig({ ...config, primaryDark: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <input
                      value={config.primaryDark || ''}
                      onChange={(e) => setConfig({ ...config, primaryDark: e.target.value })}
                      placeholder="#1d4ed8"
                      className="flex-1 rounded-lg border px-2 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Color de acento</label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="color"
                      value={config.accentColor || '#3b82f6'}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="h-9 w-12 cursor-pointer rounded border"
                    />
                    <input
                      value={config.accentColor || ''}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      placeholder="#3b82f6"
                      className="flex-1 rounded-lg border px-2 py-1.5 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Deja vacío para usar los colores azules por defecto. Los cambios se aplican a
                botones, enlaces y el banner de inicio en la tienda pública (no en el panel admin).
              </p>
              <div
                className="mt-4 overflow-hidden rounded-xl border bg-gray-50"
                style={getStoreThemeStyle(config)}
              >
                <p className="border-b bg-white px-3 py-2 text-xs font-medium text-gray-600">
                  Vista previa en vivo
                </p>
                <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 text-sm text-white">
                  {config.name || 'Mi tienda'}
                </div>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white">
                    Botón principal
                  </span>
                  <span className="text-xs font-medium text-brand-600 underline">Enlace</span>
                  <span className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white">
                    Acento
                  </span>
                </div>
              </div>
              {(config.primaryColor || config.primaryDark || config.accentColor) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {config.primaryColor && (
                    <span
                      className="rounded-lg px-4 py-2 text-sm text-white"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      Principal
                    </span>
                  )}
                  {config.primaryDark && (
                    <span
                      className="rounded-lg px-4 py-2 text-sm text-white"
                      style={{ backgroundColor: config.primaryDark }}
                    >
                      Oscuro
                    </span>
                  )}
                  {config.accentColor && (
                    <span
                      className="rounded-lg px-4 py-2 text-sm text-white"
                      style={{ backgroundColor: config.accentColor }}
                    >
                      Acento
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nota sobre imágenes (solo admin, opcional)
          </label>
          <textarea
            value={config.imageHostingNote || ''}
            onChange={(e) => setConfig({ ...config, imageHostingNote: e.target.value })}
            placeholder={`Ej. Carpeta Drive: ${DEFAULT_DRIVE_IMAGES_FOLDER_URL}`}
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
          />
          <p className="mt-1 text-xs text-gray-500">
            Incluye el enlace a tu carpeta de imágenes en Drive; se usa en el formulario de productos.
            No se muestra en la tienda pública.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-600 truncate max-w-full" title={driveFolderUrl}>
              Carpeta: {driveFolderUrl}
            </span>
            <button
              type="button"
              onClick={() => window.open(driveFolderUrl, '_blank', 'noopener,noreferrer')}
              className="shrink-0 rounded-lg border border-brand-200 bg-white px-3 py-1 text-xs text-brand-700 hover:bg-brand-50"
            >
              Abrir carpeta en Drive
            </button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">RUC del comercio</label>
            <input
              value={config.ruc || ''}
              onChange={(e) => setConfig({ ...config, ruc: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Razón social</label>
            <input
              value={config.razonSocial || ''}
              onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Envío por defecto (S/)
          </label>
          <input
            type="number"
            step="0.01"
            value={centavosToSoles(config.shippingDefault)}
            onChange={(e) =>
              setConfig({
                ...config,
                shippingDefault: solesToCentavos(parseFloat(e.target.value) || 0),
              })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Envío por distrito (opcional, S/)
          </label>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {LIMA_DISTRITOS.slice(0, 10).map((d) => (
              <div key={d} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{d}</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Por defecto"
                  value={
                    config.shippingByDistrito[d]
                      ? centavosToSoles(config.shippingByDistrito[d])
                      : ''
                  }
                  onChange={(e) => updateDistritoShipping(d, e.target.value)}
                  className="w-24 rounded-lg border px-2 py-1 text-sm"
                />
              </div>
            ))}
            <p className="text-xs text-gray-500">
              Configura distritos adicionales editando Firestore directamente o extendiendo este formulario.
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="mb-3 font-semibold text-gray-900">Pagos manuales (Yape, Plin, transferencia)</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Número Yape</label>
              <input
                value={config.payments.yapeNumber || ''}
                onChange={(e) => updatePayments('yapeNumber', e.target.value)}
                placeholder="999 888 777"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Número Plin</label>
              <input
                value={config.payments.plinNumber || ''}
                onChange={(e) => updatePayments('plinNumber', e.target.value)}
                placeholder="999 888 777"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Banco</label>
                <input
                  value={config.payments.bankName || ''}
                  onChange={(e) => updatePayments('bankName', e.target.value)}
                  placeholder="BCP, Interbank..."
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de cuenta</label>
                <input
                  value={config.payments.bankAccount || ''}
                  onChange={(e) => updatePayments('bankAccount', e.target.value)}
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CCI (Perú)</label>
              <input
                value={config.payments.bankCCI || ''}
                onChange={(e) => updatePayments('bankCCI', e.target.value)}
                placeholder="20 dígitos"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Instrucciones de pago
              </label>
              <textarea
                value={config.payments.paymentInstructions || ''}
                onChange={(e) => updatePayments('paymentInstructions', e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.payments.culqiEnabled}
              onChange={(e) => updatePayments('culqiEnabled', e.target.checked)}
            />
            Activar pasarela externa (Culqi) — futuro
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Desactivado por defecto. Habilita cuando configures las llaves Culqi y Cloud Functions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-6 py-2 text-sm text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
          {showSuccessBanner && (
            <a
              href={STOREFRONT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Ver tienda en nueva pestaña →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
