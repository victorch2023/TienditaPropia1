import { useEffect, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import { getStoreConfig, updateStoreConfig } from '../../services/store'
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
import {
  hasStripePublishableKey,
  isStripeTestPublishableKey,
} from '../../services/stripe'
import type { CardFeePolicy, StoreConfig, StripeMode } from '../../types'
import { DEFAULT_PAYMENTS_CONFIG, DEFAULT_STORE_CONFIG } from '../../types'

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
    imageHostingNote: emptyToUndefined(config.imageHostingNote),
    payments: {
      ...config.payments,
      yapeNumber: emptyToUndefined(config.payments.yapeNumber),
      plinNumber: emptyToUndefined(config.payments.plinNumber),
      bankName: emptyToUndefined(config.payments.bankName),
      bankAccount: emptyToUndefined(config.payments.bankAccount),
      bankCCI: emptyToUndefined(config.payments.bankCCI),
      paymentInstructions: emptyToUndefined(config.payments.paymentInstructions),
      stripeEnabled: config.payments.stripeEnabled ?? false,
      stripeAccountId: emptyToUndefined(config.payments.stripeAccountId),
      stripeMode: config.payments.stripeMode === 'live' ? 'live' : 'test',
      cardFeePolicy:
        config.payments.cardFeePolicy === 'pass_to_customer'
          ? 'pass_to_customer'
          : 'absorb',
      stripeFeePercent:
        typeof config.payments.stripeFeePercent === 'number'
          ? config.payments.stripeFeePercent
          : DEFAULT_PAYMENTS_CONFIG.stripeFeePercent,
      stripeFeeFixedCents:
        typeof config.payments.stripeFeeFixedCents === 'number'
          ? config.payments.stripeFeeFixedCents
          : DEFAULT_PAYMENTS_CONFIG.stripeFeeFixedCents,
      platformFeePercent:
        typeof config.payments.platformFeePercent === 'number'
          ? config.payments.platformFeePercent
          : DEFAULT_PAYMENTS_CONFIG.platformFeePercent,
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
  const [storageHelpOpen, setStorageHelpOpen] = useState(false)
  const [stripeConnectMsg, setStripeConnectMsg] = useState<string | null>(null)
  const [testAccountDraft, setTestAccountDraft] = useState('')

  useEffect(() => {
    getStoreConfig(storeId)
      .then((cfg) => {
        setConfig(cfg)
        setTestAccountDraft(cfg.payments.stripeAccountId || '')
        setStripeConnectMsg(null)
      })
      .finally(() => setLoading(false))
  }, [storeId])

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

  const stripeConnected = Boolean(config.payments.stripeAccountId?.trim())
  const publishableReady = hasStripePublishableKey()

  const handleConnectStripe = () => {
    setStripeConnectMsg(null)
    if (!publishableReady) {
      setStripeConnectMsg(
        'Pendiente de claves de prueba: configura VITE_STRIPE_PUBLISHABLE_KEY (pk_test_…) en .env y redespliega. Las pruebas reales con Stripe vienen después.'
      )
      return
    }
    const accountId =
      testAccountDraft.trim() || config.payments.stripeAccountId?.trim() || ''
    if (!accountId) {
      setStripeConnectMsg(
        'Para desarrollo UI, pega un Account ID de prueba (acct_…) abajo y pulsa de nuevo, o guarda la config con el ID. Onboarding Connect real se activa en la fase de pruebas.'
      )
      return
    }
    updatePayments('stripeAccountId', accountId)
    setTestAccountDraft('')
    setStripeConnectMsg(
      `Account ID de prueba guardado en el formulario (${accountId}). Pulsa «Guardar configuración» para persistirlo. Conexión live / onboarding: después.`
    )
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

      <details
        open={storageHelpOpen}
        onToggle={(e) => setStorageHelpOpen((e.target as HTMLDetailsElement).open)}
        className="mb-6 rounded-xl border border-brand-100 bg-brand-50 p-4"
      >
        <summary className="cursor-pointer font-medium text-brand-900">
          Cómo subir imágenes (Firebase Storage)
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-brand-800">
          <li>
            En Admin → <strong>Productos</strong> → Nuevo / Editar, pulsa{' '}
            <strong>Elegir imágenes</strong>.
          </li>
          <li>
            Los archivos se suben a <strong>Firebase Storage</strong> (
            <code className="rounded bg-brand-100 px-1">stores/{'{storeId}'}/…</code>
            ).
          </li>
          <li>
            Al <strong>Guardar</strong>, la URL de descarga se guarda en el producto en{' '}
            <strong>Firestore</strong> (<code className="rounded bg-brand-100 px-1">images</code>
            ). Storage = archivos; Firestore = metadatos/URLs.
          </li>
          <li>
            No uses Google Drive para imágenes nuevas. Las URLs antiguas de Drive u otros hosts
            siguen mostrándose en el catálogo (legado).
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
            placeholder="https://… (Firebase Storage u otra URL pública)"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Recomendado: 200×200 px, cuadrado, PNG con fondo transparente, máx. 500 KB. Preferible
            URL de Firebase Storage.
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
                Banner de inicio (URL de imagen)
              </label>
              <input
                value={config.heroBannerUrl || ''}
                onChange={(e) => setConfig({ ...config, heroBannerUrl: e.target.value })}
                placeholder="https://… (Firebase Storage u otra URL pública)"
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
                placeholder="https://… (Firebase Storage u otra URL pública)"
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
            placeholder="Ej. Sube desde Admin → Productos (Firebase Storage). Las URLs quedan en Firestore."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            rows={2}
          />
          <p className="mt-1 text-xs text-gray-500">
            Recordatorio interno para quien administra la tienda. Flujo correcto: subir a Firebase
            Storage desde el admin; la URL se guarda en Firestore. No se muestra en la tienda
            pública. Google Drive ya no es el método recomendado.
          </p>
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
          <h2 className="mb-1 font-semibold text-gray-900">
            Pago con tarjeta (Stripe)
          </h2>
          <p className="mb-3 text-xs text-gray-500">
            Estructura y formularios listos. Modo test por defecto. Las pruebas reales con
            Stripe y el modo live se activan después — no guardes secret keys aquí.
          </p>

          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                stripeConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {stripeConnected ? 'Conectado (Account ID)' : 'No conectado'}
            </span>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700">
              Modo: {config.payments.stripeMode === 'live' ? 'live' : 'test'}
            </span>
            {!publishableReady && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                Sin pk_test en .env
              </span>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(config.payments.stripeEnabled)}
                onChange={(e) => updatePayments('stripeEnabled', e.target.checked)}
              />
              Activar pago con tarjeta (Stripe) en el checkout
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Política de comisión de tarjeta
              </label>
              <select
                value={
                  (config.payments.cardFeePolicy as CardFeePolicy) || 'absorb'
                }
                onChange={(e) =>
                  updatePayments('cardFeePolicy', e.target.value as CardFeePolicy)
                }
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="absorb">La tienda asume la comisión</option>
                <option value="pass_to_customer">
                  El cliente paga la comisión estimada
                </option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  % estimado Stripe
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    config.payments.stripeFeePercent ??
                    DEFAULT_PAYMENTS_CONFIG.stripeFeePercent
                  }
                  onChange={(e) =>
                    updatePayments(
                      'stripeFeePercent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Fijo estimado (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={centavosToSoles(
                    config.payments.stripeFeeFixedCents ??
                      DEFAULT_PAYMENTS_CONFIG.stripeFeeFixedCents ??
                      100
                  )}
                  onChange={(e) =>
                    updatePayments(
                      'stripeFeeFixedCents',
                      solesToCentavos(parseFloat(e.target.value) || 0)
                    )
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  % plataforma (opcional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.payments.platformFeePercent ?? 0}
                  onChange={(e) =>
                    updatePayments(
                      'platformFeePercent',
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Los % y el fijo son <strong>estimados</strong> para mostrar el desglose al
              cliente. El cargo final lo confirma Stripe al procesar el pago.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Modo Stripe
              </label>
              <select
                value={(config.payments.stripeMode as StripeMode) || 'test'}
                onChange={(e) => {
                  const mode = e.target.value as StripeMode
                  if (mode === 'live') {
                    const ok = window.confirm(
                      'Modo live solo cuando estemos listos. ¿Activarlo de todas formas? (recomendado: dejar en test)'
                    )
                    if (!ok) return
                  }
                  updatePayments('stripeMode', mode)
                }}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="test">Test (recomendado)</option>
                <option value="live">Live — solo cuando estemos listos</option>
              </select>
              {config.payments.stripeMode === 'live' && (
                <p className="mt-1 text-xs text-red-700">
                  Advertencia: live deshabilitado en flujo real hasta la fase final. Usa
                  keys test (pk_test_ / sk_test_) hasta nuevo aviso.
                </p>
              )}
              {publishableReady && !isStripeTestPublishableKey() && (
                <p className="mt-1 text-xs text-red-700">
                  VITE_STRIPE_PUBLISHABLE_KEY no parece de test (pk_test_…).
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account ID de prueba (opcional, desarrollo UI)
              </label>
              <input
                value={testAccountDraft}
                onChange={(e) => setTestAccountDraft(e.target.value)}
                placeholder="acct_…"
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
              />
              <p className="mt-1 text-xs text-gray-500">
                Stub de Connect: guarda un ID manual para probar la UI. No es onboarding
                real de Stripe.
              </p>
              {config.payments.stripeAccountId && (
                <p className="mt-1 text-xs text-gray-600">
                  Guardado actualmente:{' '}
                  <span className="font-mono">{config.payments.stripeAccountId}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleConnectStripe}
                className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
              >
                Conectar Stripe
              </button>
              {stripeConnected && (
                <button
                  type="button"
                  onClick={() => {
                    updatePayments('stripeAccountId', '')
                    setTestAccountDraft('')
                    setStripeConnectMsg('Account ID quitado del formulario. Guarda para persistir.')
                  }}
                  className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Desconectar
                </button>
              )}
            </div>
            {stripeConnectMsg && (
              <p
                role="status"
                className="text-sm text-gray-700 rounded-lg border bg-gray-50 px-3 py-2"
              >
                {stripeConnectMsg}
              </p>
            )}
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
            Desactivado por defecto. No rompe Yape/Plin. Preferir Stripe para tarjeta.
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
