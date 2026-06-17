import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getOrder } from '../../services/orders'
import { OrderStatusBadge } from '../../components/OrderStatusBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import type { ManualPaymentMethod, Order } from '../../types'

const MANUAL_METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
}

export function OrderConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getOrder(id)
      .then(setOrder)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!order) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Pedido no encontrado.</p>
        <Link to="/" className="mt-4 text-brand-600 hover:underline">
          Ir al inicio
        </Link>
      </div>
    )
  }

  const isPendingManual =
    order.status === 'pendiente_pago' && order.payment?.method === 'manual'
  const isPaid = order.status !== 'pendiente_pago' && order.status !== 'cancelado'

  return (
    <div className="mx-auto max-w-lg text-center">
      <div className="mb-6 text-5xl">{isPendingManual ? '⏳' : '✓'}</div>
      <h1 className="text-2xl font-bold text-gray-900">
        {isPendingManual ? 'Pedido registrado — pendiente de verificación' : '¡Pedido confirmado!'}
      </h1>
      <p className="mt-2 text-gray-600">
        Número de pedido: <strong>#{order.id.slice(-8).toUpperCase()}</strong>
      </p>
      {isPendingManual && (
        <p className="mt-3 text-sm text-amber-800">
          Hemos recibido tu pedido. El comercio verificará tu pago y te confirmará por correo o
          teléfono. No es necesario volver a pagar.
        </p>
      )}
      <div className="mt-4">
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 text-left">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">{isPaid ? 'Total pagado' : 'Total a pagar'}</dt>
            <dd className="font-bold text-brand-600">{formatSoles(order.total)}</dd>
          </div>
          {order.payment?.manualMethod && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Método de pago</dt>
              <dd>{MANUAL_METHOD_LABELS[order.payment.manualMethod]}</dd>
            </div>
          )}
          {order.payment?.paymentReference && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Referencia</dt>
              <dd>{order.payment.paymentReference}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-600">Envío a</dt>
            <dd>
              {order.shippingAddress.distrito}, {order.shippingAddress.direccion}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-600">Comprobante</dt>
            <dd>
              {order.fiscal.tipo === 'boleta' ? 'Boleta' : 'Factura'} —{' '}
              {order.fiscal.documento}
            </dd>
          </div>
        </dl>
      </div>
      <Link
        to="/cuenta"
        className="mt-6 inline-block rounded-lg bg-brand-600 px-6 py-3 text-white hover:bg-brand-700"
      >
        Ver mis pedidos
      </Link>
    </div>
  )
}
