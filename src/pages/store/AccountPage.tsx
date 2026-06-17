import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { signIn, signUp, logOut } from '../../services/auth'
import { getOrdersByUser } from '../../services/orders'
import { OrderStatusBadge } from '../../components/OrderStatusBadge'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import type { Order } from '../../types'

export function AccountPage() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setLoadingOrders(true)
      getOrdersByUser(user.uid)
        .then(setOrders)
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false))
    }
  }, [user])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      if (isSignUp) {
        await signUp(email, password, displayName)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación')
    }
  }

  if (authLoading) return <LoadingSpinner />

  if (!user) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">
          {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
        </h1>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <form onSubmit={handleAuth} className="space-y-4 rounded-xl border bg-white p-6">
          {isSignUp && (
            <input
              placeholder="Nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            required
            minLength={6}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700"
          >
            {isSignUp ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="mt-4 w-full text-sm text-brand-600 hover:underline"
        >
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>
        <button
          onClick={() => logOut()}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Mis pedidos</h2>
      {loadingOrders ? (
        <LoadingSpinner />
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Aún no tienes pedidos.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">#{order.id.slice(-8).toUpperCase()}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="mt-1 text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString('es-PE')} —{' '}
                {formatSoles(order.total)}
              </p>
              <Link
                to={`/pedido/${order.id}`}
                className="mt-2 inline-block text-sm text-brand-600 hover:underline"
              >
                Ver detalle
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
