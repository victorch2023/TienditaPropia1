import { useEffect, useState } from 'react'
import {
  getAllOrders,
  updateOrderStatus,
  updateOrderFiscalStatus,
  confirmManualPayment,
} from '../../services/orders'
import { FUNCTIONS_URL } from '../../services/firebase'
import { OrderStatusBadge, STATUS_LABELS } from '../../components/OrderStatusBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import type { ManualPaymentMethod, Order, OrderStatus } from '../../types'

const MANUAL_METHOD_LABELS: Record<ManualPaymentMethod, string> = {
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia bancaria',
}

const NEXT_STATUSES: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pagado: ['en_preparacion', 'cancelado'],
  en_preparacion: ['enviado', 'cancelado'],
  enviado: ['entregado'],
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [invoicing, setInvoicing] = useState(false)

  const load = () => {
    setLoading(true)
    getAllOrders()
      .then(setOrders)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleConfirmPayment = async (orderId: string) => {
    await confirmManualPayment(orderId)
    load()
    if (selected?.id === orderId) {
      const updated = await getAllOrders()
      setSelected(updated.find((o) => o.id === orderId) || null)
    }
  }

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    await updateOrderStatus(orderId, status)
    load()
    if (selected?.id === orderId) {
      const updated = await getAllOrders()
      setSelected(updated.find((o) => o.id === orderId) || null)
    }
  }

  const handleEmitInvoice = async (order: Order) => {
    setInvoicing(true)
    try {
      const res = await fetch(`${FUNCTIONS_URL}/createInvoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (data.success) {
        await updateOrderFiscalStatus(order.id, 'emitido')
        load()
        setSelected({ ...order, fiscal: { ...order.fiscal, status: 'emitido' } })
      } else {
        alert(data.message || 'Función stub — conectar Nubefact para emitir')
      }
    } catch {
      alert('Error al llamar createInvoice. Despliega Cloud Functions primero.')
    } finally {
      setInvoicing(false)
    }
  }

  if (loading) return <LoadingSpinner />

  const pendingFiscal = orders.filter((o) => o.fiscal.status === 'pendiente' && o.status !== 'cancelado')

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Pedidos</h1>

      {pendingFiscal.length > 0 && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="font-medium text-yellow-800">
            {pendingFiscal.length} pedido(s) pendiente(s) de facturar
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Pedido</th>
                <th className="px-4 py-3 text-left">Cliente</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => setSelected(o)}
                  className={`cursor-pointer border-t hover:bg-gray-50 ${
                    selected?.id === o.id ? 'bg-brand-50' : ''
                  }`}
                >
                  <td className="px-4 py-3">#{o.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3">{o.shippingAddress.nombre}</td>
                  <td className="px-4 py-3">{formatSoles(o.total)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-semibold">Pedido #{selected.id.slice(-8).toUpperCase()}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(selected.createdAt).toLocaleString('es-PE')}
            </p>

            <div className="mt-4">
              <OrderStatusBadge status={selected.status} />
            </div>

            <h3 className="mt-4 font-medium">Productos</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {selected.items.map((item, i) => (
                <li key={i}>
                  {item.name} x{item.quantity} — {formatSoles(item.price * item.quantity)}
                </li>
              ))}
            </ul>

            <h3 className="mt-4 font-medium">Envío</h3>
            <p className="text-sm text-gray-600">
              {selected.shippingAddress.nombre}<br />
              {selected.shippingAddress.distrito}, {selected.shippingAddress.direccion}<br />
              Tel: {selected.shippingAddress.telefono}
            </p>

            <h3 className="mt-4 font-medium">Pago</h3>
            {selected.payment ? (
              <div className="text-sm text-gray-600">
                {selected.payment.method === 'manual' && selected.payment.manualMethod && (
                  <p>Método: {MANUAL_METHOD_LABELS[selected.payment.manualMethod]}</p>
                )}
                {selected.payment.method === 'culqi' && <p>Método: Tarjeta (Culqi)</p>}
                {selected.payment.paymentReference && (
                  <p>Referencia: {selected.payment.paymentReference}</p>
                )}
                {selected.payment.paymentProofUrl && (
                  <p className="mt-2">
                    <a
                      href={toDirectImageUrl(selected.payment.paymentProofUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline"
                    >
                      Ver comprobante de pago
                    </a>
                  </p>
                )}
                {!selected.payment.manualMethod &&
                  !selected.payment.paymentReference &&
                  !selected.payment.paymentProofUrl && (
                    <p className="text-gray-500">Sin datos de pago registrados</p>
                  )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin datos de pago</p>
            )}

            {selected.status === 'pendiente_pago' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleConfirmPayment(selected.id)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
                >
                  Confirmar pago recibido
                </button>
                <button
                  onClick={() => handleStatusChange(selected.id, 'cancelado')}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Rechazar / cancelar
                </button>
              </div>
            )}

            <h3 className="mt-4 font-medium">Fiscal</h3>
            <p className="text-sm text-gray-600">
              {selected.fiscal.tipo === 'boleta' ? 'Boleta' : 'Factura'} —{' '}
              {selected.fiscal.documento}
              {selected.fiscal.razonSocial && ` — ${selected.fiscal.razonSocial}`}
              <br />
              Estado fiscal: {selected.fiscal.status}
            </p>

            {selected.fiscal.status === 'pendiente' && selected.status !== 'cancelado' && (
              <button
                onClick={() => handleEmitInvoice(selected)}
                disabled={invoicing}
                className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {invoicing ? 'Procesando...' : 'Emitir comprobante (Nubefact)'}
              </button>
            )}

            <h3 className="mt-4 font-medium">Cambiar estado</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {(NEXT_STATUSES[selected.status] || []).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(selected.id, s)}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  → {STATUS_LABELS[s]}
                </button>
              ))}
            </div>

            <dl className="mt-4 space-y-1 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatSoles(selected.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>IGV</dt>
                <dd>{formatSoles(selected.igv)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd>{formatSoles(selected.shipping)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Total</dt>
                <dd>{formatSoles(selected.total)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  )
}
