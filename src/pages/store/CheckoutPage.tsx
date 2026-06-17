import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LIMA_DISTRITOS } from '../../data/lima-distritos'
import { useCart } from '../../hooks/useCart'
import { useStoreConfig } from '../../hooks/useStoreConfig'
import { useAuth } from '../../hooks/useAuth'
import {
  createOrder,
} from '../../services/orders'
import { getShippingCost } from '../../services/store'
import { chargeWithCulqi, initCulqiCheckout } from '../../services/culqi'
import { CULQI_PUBLIC_KEY } from '../../services/firebase'
import { validateDNI, validateRUC } from '../../utils/fiscal'
import { formatSoles, calculateTotal } from '../../utils/money'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import type { FiscalData, ManualPaymentMethod, OrderItem, ShippingAddress } from '../../types'

type Step = 1 | 2 | 3

const MANUAL_METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { config } = useStoreConfig()
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(1)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const [shipping, setShipping] = useState<ShippingAddress>({
    nombre: user?.displayName || '',
    email: user?.email || '',
    telefono: '',
    distrito: '',
    direccion: '',
    referencia: '',
  })

  const [fiscalType, setFiscalType] = useState<'boleta' | 'factura'>('boleta')
  const [dni, setDni] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState(shipping.nombre)
  const [ruc, setRuc] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [direccionFiscal, setDireccionFiscal] = useState('')

  const [manualMethod, setManualMethod] = useState<ManualPaymentMethod>('yape')
  const [paymentReference, setPaymentReference] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  const shippingCost = shipping.distrito
    ? getShippingCost(config, shipping.distrito)
    : config.shippingDefault
  const totals = calculateTotal(subtotal, shippingCost, config.igvRate)
  const payments = config.payments

  if (items.length === 0 && step < 3) {
    navigate('/carrito')
    return null
  }

  const validateStep1 = () => {
    if (!shipping.nombre || !shipping.email || !shipping.telefono) {
      setError('Completa todos los campos de contacto')
      return false
    }
    if (!shipping.distrito || !shipping.direccion) {
      setError('Selecciona distrito y dirección')
      return false
    }
    setError('')
    return true
  }

  const validateStep2 = () => {
    if (fiscalType === 'boleta') {
      if (!validateDNI(dni)) {
        setError('DNI inválido (8 dígitos)')
        return false
      }
      if (!nombreCompleto.trim()) {
        setError('Ingresa tu nombre completo')
        return false
      }
    } else {
      if (!validateRUC(ruc)) {
        setError('RUC inválido')
        return false
      }
      if (!razonSocial.trim() || !direccionFiscal.trim()) {
        setError('Completa razón social y dirección fiscal')
        return false
      }
    }
    setError('')
    return true
  }

  const buildFiscal = (): FiscalData => {
    if (fiscalType === 'boleta') {
      return {
        tipo: 'boleta',
        documento: dni,
        nombreCompleto,
        status: 'pendiente',
      }
    }
    return {
      tipo: 'factura',
      documento: ruc,
      razonSocial,
      direccionFiscal,
      status: 'pendiente',
    }
  }

  const buildOrderItems = (): OrderItem[] =>
    items.map((i) => ({
      productId: i.productId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      imageUrl: i.imageUrl,
      variantName: i.variantName,
    }))

  const handleManualPayment = async () => {
    setProcessing(true)
    setError('')
    try {
      const orderId = await createOrder({
        userId: user?.uid,
        items: buildOrderItems(),
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        shipping: totals.shipping,
        status: 'pendiente_pago',
        payment: {
          method: 'manual',
          manualMethod,
          paymentReference: paymentReference.trim() || undefined,
          paymentProofUrl: proofUrl.trim()
            ? toDirectImageUrl(proofUrl.trim())
            : undefined,
          submittedAt: Date.now(),
        },
        fiscal: buildFiscal(),
        shippingAddress: shipping,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      clearCart()
      navigate(`/pedido/${orderId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar pedido')
      setProcessing(false)
    }
  }

  const handleCulqiPayment = async () => {
    setProcessing(true)
    setError('')
    try {
      const orderId = await createOrder({
        userId: user?.uid,
        items: buildOrderItems(),
        subtotal: totals.subtotal,
        igv: totals.igv,
        total: totals.total,
        shipping: totals.shipping,
        status: 'pendiente_pago',
        fiscal: buildFiscal(),
        shippingAddress: shipping,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      initCulqiCheckout(
        CULQI_PUBLIC_KEY,
        totals.total,
        orderId,
        async (tokenId) => {
          try {
            await chargeWithCulqi({
              token: tokenId,
              orderId,
              amount: totals.total,
              email: shipping.email,
            })
            clearCart()
            navigate(`/pedido/${orderId}`)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Error en el pago')
            setProcessing(false)
          }
        },
        (msg) => {
          setError(msg)
          setProcessing(false)
        }
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear pedido')
      setProcessing(false)
    }
  }

  const renderPaymentInstructions = () => {
    if (manualMethod === 'yape' && payments.yapeNumber) {
      return (
        <p className="text-sm text-gray-700">
          Número Yape: <strong>{payments.yapeNumber}</strong>
        </p>
      )
    }
    if (manualMethod === 'plin' && payments.plinNumber) {
      return (
        <p className="text-sm text-gray-700">
          Número Plin: <strong>{payments.plinNumber}</strong>
        </p>
      )
    }
    if (manualMethod === 'transferencia') {
      return (
        <div className="space-y-1 text-sm text-gray-700">
          {payments.bankName && (
            <p>
              Banco: <strong>{payments.bankName}</strong>
            </p>
          )}
          {payments.bankAccount && (
            <p>
              Cuenta: <strong>{payments.bankAccount}</strong>
            </p>
          )}
          {payments.bankCCI && (
            <p>
              CCI: <strong>{payments.bankCCI}</strong>
            </p>
          )}
        </div>
      )
    }
    return (
      <p className="text-sm text-amber-700">
        El comercio aún no configuró los datos de pago. Contacta al vendedor.
      </p>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="mb-6 flex gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 rounded-full py-1 text-center text-xs font-medium ${
              step >= s ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            Paso {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {step === 1 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Datos de envío (Lima Metropolitana)</h2>
          <input
            placeholder="Nombre completo"
            value={shipping.nombre}
            onChange={(e) => setShipping({ ...shipping, nombre: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={shipping.email}
            onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Teléfono"
            value={shipping.telefono}
            onChange={(e) => setShipping({ ...shipping, telefono: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <select
            value={shipping.distrito}
            onChange={(e) => setShipping({ ...shipping, distrito: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Seleccionar distrito</option>
            {LIMA_DISTRITOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <input
            placeholder="Dirección"
            value={shipping.direccion}
            onChange={(e) => setShipping({ ...shipping, direccion: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <input
            placeholder="Referencia (opcional)"
            value={shipping.referencia}
            onChange={(e) => setShipping({ ...shipping, referencia: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <button
            onClick={() => validateStep1() && setStep(2)}
            className="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Comprobante fiscal</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={fiscalType === 'boleta'}
                onChange={() => setFiscalType('boleta')}
              />
              Boleta (DNI)
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={fiscalType === 'factura'}
                onChange={() => setFiscalType('factura')}
              />
              Factura (RUC)
            </label>
          </div>
          {fiscalType === 'boleta' ? (
            <>
              <input
                placeholder="DNI (8 dígitos)"
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Nombre completo"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </>
          ) : (
            <>
              <input
                placeholder="RUC (11 dígitos)"
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Razón social"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <input
                placeholder="Dirección fiscal"
                value={direccionFiscal}
                onChange={(e) => setDireccionFiscal(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 rounded-lg border py-3">
              Atrás
            </button>
            <button
              onClick={() => validateStep2() && setStep(3)}
              className="flex-1 rounded-lg bg-brand-600 py-3 text-white"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Resumen y pago</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatSoles(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>IGV</dt>
              <dd>{formatSoles(totals.igv)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Envío ({shipping.distrito})</dt>
              <dd>{formatSoles(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <dt>Total</dt>
              <dd className="text-brand-600">{formatSoles(totals.total)}</dd>
            </div>
          </dl>
          <p className="text-sm text-gray-500">
            Comprobante: {fiscalType === 'boleta' ? `Boleta - DNI ${dni}` : `Factura - RUC ${ruc}`}
          </p>

          <div className="rounded-lg bg-gray-50 p-4">
            <h3 className="mb-3 text-sm font-medium text-gray-900">Método de pago</h3>
            <div className="flex flex-wrap gap-3">
              {(['yape', 'plin', 'transferencia'] as ManualPaymentMethod[]).map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={manualMethod === m}
                    onChange={() => setManualMethod(m)}
                  />
                  {MANUAL_METHOD_LABELS[m]}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-brand-900">Instrucciones de pago</h3>
            {payments.paymentInstructions && (
              <p className="mb-2 text-sm text-brand-800">{payments.paymentInstructions}</p>
            )}
            {renderPaymentInstructions()}
            <p className="mt-2 text-sm font-medium text-brand-900">
              Monto a pagar: {formatSoles(totals.total)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de operación / referencia (opcional)
            </label>
            <input
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Ej. 00123456"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL del comprobante (opcional)
            </label>
            <p className="mt-0.5 text-xs text-gray-500">
              Sube tu captura a Google Drive (carpeta pública) y pega el enlace aquí.
            </p>
            <div className="mt-1 flex gap-2">
              <input
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              {proofUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setProofUrl(toDirectImageUrl(proofUrl))}
                  className="shrink-0 rounded-lg border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Drive → directo
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 rounded-lg border py-3">
              Atrás
            </button>
            <button
              onClick={handleManualPayment}
              disabled={processing}
              className="flex-1 rounded-lg bg-brand-600 py-3 text-white disabled:opacity-50"
            >
              {processing ? 'Registrando...' : 'Registrar pedido'}
            </button>
          </div>

          {payments.culqiEnabled && (
            <div className="border-t pt-4 text-center">
              <p className="mb-2 text-xs text-gray-500">O paga con tarjeta</p>
              <button
                onClick={handleCulqiPayment}
                disabled={processing}
                className="text-sm text-brand-600 underline hover:text-brand-700 disabled:opacity-50"
              >
                Pagar con tarjeta (Culqi)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
