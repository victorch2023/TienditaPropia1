import { useEffect, useState } from 'react'
import { getAllOrders, updateOrderFiscalStatus } from '../../services/orders'
import { FUNCTIONS_URL } from '../../services/firebase'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import type { Order } from '../../types'

export function AdminBillingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pendiente' | 'emitido' | 'all'>('pendiente')
  const [invoicing, setInvoicing] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getAllOrders()
      .then((all) =>
        setOrders(all.filter((o) => o.status !== 'pendiente_pago' && o.status !== 'cancelado'))
      )
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true
    return o.fiscal.status === filter
  })

  const handleEmit = async (order: Order) => {
    setInvoicing(order.id)
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
      } else {
        alert(data.message || 'Error al emitir comprobante')
      }
    } catch {
      alert('Error al llamar createInvoice. Despliega Cloud Functions primero.')
    } finally {
      setInvoicing(null)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Facturación</h1>
      <p className="mb-6 text-sm text-gray-600">
        Gestiona boletas y facturas. La integración con Nubefact/SUNAT se conectará en una fase futura.
      </p>

      <div className="mb-6 flex gap-2">
        {(['pendiente', 'emitido', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-sm capitalize ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {f === 'all' ? 'Todos' : f}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {filtered.length === 0 ? (
          <p className="p-6 text-gray-500">No hay comprobantes {filter !== 'all' ? filter + 's' : ''}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Pedido</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Documento</th>
                <th className="p-3 text-left">Cliente</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">Estado fiscal</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-t border-gray-100">
                  <td className="p-3 font-medium">{o.id}</td>
                  <td className="p-3 capitalize">{o.fiscal.tipo}</td>
                  <td className="p-3">{o.fiscal.documento}</td>
                  <td className="p-3">{o.fiscal.nombreCompleto ?? o.fiscal.razonSocial}</td>
                  <td className="p-3">{formatSoles(o.total)}</td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        o.fiscal.status === 'emitido'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {o.fiscal.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {o.fiscal.status === 'pendiente' && (
                      <button
                        type="button"
                        onClick={() => handleEmit(o)}
                        disabled={invoicing === o.id}
                        className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50"
                      >
                        {invoicing === o.id ? 'Emitiendo...' : 'Emitir comprobante'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
