import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { getStoreConfig, updateStoreConfig } from '../../services/store'
import {
  uploadBrandingImage,
  type BrandingAssetKind,
} from '../../services/storage'
import { LIMA_DISTRITOS } from '../../data/lima-distritos'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { centavosToSoles, solesToCentavos } from '../../utils/money'
import { DriveImage } from '../../components/DriveImage'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import { getStoreThemeStyle } from '../../utils/theme'
import { getDocumentBaseHref } from '../../config/domains'
import {
  CITROLEAF_DISABLE_BANK_TRANSFER,
  CITROLEAF_STORE_ID,
} from '../../config/stores'
import type { StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeConfigForSave(config: StoreConfig): StoreConfig {
  const shippingByDistrito = Object.fromEntries(
    Object.entries(config.shippingByDistrito || {}).filter(
      ([, v]) => typeof v === 'number' && v > 0
    )
  )
  return {
    ...config,
    shippingByDistrito,
    logoUrl: config.logoUrl?.trim() ? toDirectImageUrl(config.logoUrl) : undefined,
    heroBannerUrl: config.heroBannerUrl?.trim()
      ? toDirectImageUrl(config.heroBannerUrl)
      : undefined,
    backgroundImageUrl: config.backgroundImageUrl?.trim()
      ? toDirectImageUrl(config.backgroundImageUrl)
      : undefined,
    description: emptyToUndefined(config.description),
    primaryColor: emptyToUndefined(config.primaryColor),
    primaryDark: emptyToUndefined(config.primaryDark),
    accentColor: emptyToUndefined(config.accentColor),
    ruc: emptyToUndefined(config.ruc),
    razonSocial: emptyToUndefined(config.razonSocial),
    payments: {
      ...config.payments,
      yapeNumber: emptyToUndefined(config.payments.yapeNumber),
      plinNumber: emptyToUndefined(config.payments.plinNumber),
      bankName: emptyToUndefined(config.payments.bankName),
      bankAccount: emptyToUndefined(config.payments.bankAccount),
      bankCCI: emptyToUndefined(config.payments.bankCCI),
      paymentInstructions: emptyToUndefined(config.payments.paymentInstructions),
    },
  }
}

const STOREFRONT_URL = `${window.location.origin}${getDocumentBaseHref()}`

export function AdminConfigPage() {
  const { storeId } = useStore()
  const disableBankTransfer =
    storeId === CITROLEAF_STORE_ID && CITROLEAF_DISABLE_BANK_TRANSFER
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedConfigJson, setSavedConfigJson] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{
    kind: BrandingAssetKind
    percent: number
  } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const heroInputRef = useRef<HTMLInputElement>(null)
  const backgroundInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getStoreConfig(storeId)
      .then((cfg) => {
        setConfig(cfg)
      })
      .finally(() => setLoading(false))
  }, [storeId])

  const handleBrandingUpload = async (
    kind: BrandingAssetKind,
    files: FileList | null
  ) => {
    const file = files?.[0]
    if (!file) return
    setUploadError(null)
    setUploadProgress({ kind, percent: 0 })
    try {
      const url = await uploadBrandingImage(storeId, kind, file, (percent) =>
        setUploadProgress({ kind, percent })
      )
      if (kind === 'logo') setConfig((c) => ({ ...c, logoUrl: url }))
      else if (kind === 'hero') setConfig((c) => ({ ...c, heroBannerUrl: url }))
      else setConfig((c) => ({ ...c, backgroundImageUrl: url }))
      setSavedConfigJson(null)
      setUploadProgress(null)
    } catch (err) {
      setUploadProgress(null)
      setUploadError(
        err instanceof Error ? err.message : 'Error al subir la imagen.'
      )
    } finally {
      if (kind === 'logo' && logoInputRef.current) logoInputRef.current.value = ''
      if (kind === 'hero' && heroInputRef.current) heroInputRef.current.value = ''
      if (kind === 'background' && backgroundInputRef.current) {
        backgroundInputRef.current.value = ''
      }
    }
  }

  const brandingUploading = uploadProgress !== null

  const showSuccessBanner =
    savedConfigJson !== null &&
    savedConfigJson === JSON.stringify(normalizeConfigForSave(config))

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      const toSave = normalizeConfigForSave(config)
      await updateStoreConfig(storeId, toSave)
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
    const next = { ...config.shippingByDistrito }
    const trimmed = soles.trim()
    if (!trimmed) {
      delete next[distrito]
    } else {
      const centavos = solesToCentavos(parseFloat(trimmed) || 0)
      if (centavos > 0) next[distrito] = centavos
      else delete next[distrito]
    }
    setConfig({ ...config, shippingByDistrito: next })
  }

  const updatePayments = (
    field: keyof StoreConfig['payments'],
    value: string | boolean | number
  ) => {
    setConfig({
      ...config,
      payments: { ...config.payments, [field]: value },
    })
    setSavedConfigJson(null)
  }

  if (loading) return <LoadingSpinner />

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
          <label className="block text-sm font-medium text-gray-700">Logo</label>
          <p className="mt-1 text-xs text-gray-500">
            Recomendado: 200×200 px, cuadrado, PNG con fondo transparente, máx. 500 KB. Se sube a
            Firebase Storage.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                brandingUploading ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploadProgress?.kind === 'logo'
                ? `Subiendo… ${uploadProgress.percent}%`
                : 'Subir imagen'}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={brandingUploading}
                onChange={(e) => void handleBrandingUpload('logo', e.target.files)}
              />
            </label>
            {config.logoUrl?.trim() && (
              <button
                type="button"
                onClick={() => {
                  setConfig({ ...config, logoUrl: undefined })
                  setSavedConfigJson(null)
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Quitar
              </button>
            )}
          </div>
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
                Banner de inicio
              </label>
              <p className="mt-1 text-xs text-gray-500">
                Recomendado: 1200×400 px (proporción 3:1), máx. 2 MB, JPG/PNG/WebP. Si está vacío,
                se muestra un degradado con los colores de la marca.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                    brandingUploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadProgress?.kind === 'hero'
                    ? `Subiendo… ${uploadProgress.percent}%`
                    : 'Subir imagen'}
                  <input
                    ref={heroInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={brandingUploading}
                    onChange={(e) => void handleBrandingUpload('hero', e.target.files)}
                  />
                </label>
                {config.heroBannerUrl?.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, heroBannerUrl: undefined })
                      setSavedConfigJson(null)
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
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
              <p className="mt-1 text-xs text-gray-500">
                Recomendado: 1920×1080 px, imagen suave o patrón, máx. 2 MB. Se aplica con
                opacidad para mantener el texto legible.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                    brandingUploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadProgress?.kind === 'background'
                    ? `Subiendo… ${uploadProgress.percent}%`
                    : 'Subir imagen'}
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={brandingUploading}
                    onChange={(e) =>
                      void handleBrandingUpload('background', e.target.files)
                    }
                  />
                </label>
                {config.backgroundImageUrl?.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setConfig({ ...config, backgroundImageUrl: undefined })
                      setSavedConfigJson(null)
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
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

            {uploadError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {uploadError}
              </p>
            )}
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
            {(() => {
              const preview: string[] = [...LIMA_DISTRITOS.slice(0, 10)]
              const withOverride = Object.keys(config.shippingByDistrito || {}).filter(
                (d) => (config.shippingByDistrito[d] ?? 0) > 0 && !preview.includes(d)
              )
              const districts = [...preview, ...withOverride.sort()]
              return districts.map((d) => (
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
              ))
            })()}
            <p className="text-xs text-gray-500">
              Vacío = usa el envío por defecto. Distritos con override fuera de la lista
              inicial también aparecen aquí.
            </p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h2 className="mb-3 font-semibold text-gray-900">
            {disableBankTransfer
              ? 'Pagos manuales (Yape, Plin)'
              : 'Pagos manuales (Yape, Plin, transferencia)'}
          </h2>
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
            {!disableBankTransfer && (
              <>
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
              </>
            )}
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
            Activar pasarela externa (Culqi) — legado / futuro
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Desactivado por defecto. No rompe Yape/Plin/transferencia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t pt-4">
          <button
            onClick={handleSave}
            disabled={saving || brandingUploading}
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
