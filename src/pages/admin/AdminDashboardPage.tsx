import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllOrders } from '../../services/orders'
import { getProducts } from '../../services/products'
import { OrderStatusBadge } from '../../components/OrderStatusBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import type { Order, Product } from '../../types'

export function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAllOrders(), getProducts(false)])
      .then(([o, p]) => {
        setOrders(o)
        setProducts(p)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const today = new Date().setHours(0, 0, 0, 0)
  const todayOrders = orders.filter((o) => o.createdAt >= today && o.status !== 'cancelado')
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0)
  const lowStock = products.filter((p) => p.active && p.stock <= 5)

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Ventas hoy</p>
          <p className="text-2xl font-bold text-brand-600">{formatSoles(todaySales)}</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Pedidos hoy</p>
          <p className="text-2xl font-bold">{todayOrders.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-6">
          <p className="text-sm text-gray-500">Stock bajo</p>
          <p className="text-2xl font-bold text-orange-600">{lowStock.length}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Pedidos recientes</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">Sin pedidos aún.</p>
      ) : (
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
              {orders.slice(0, 10).map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link to={`/admin/pedidos`} className="text-brand-600 hover:underline">
                      #{o.id.slice(-8).toUpperCase()}
                    </Link>
                  </td>
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
      )}
    </div>
  )
}
