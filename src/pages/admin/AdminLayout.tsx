import { Link, NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { isStoreAdmin, logOut } from '../../services/auth'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { DemoBanner } from '../../components/DemoBanner'
import { isDemoMode } from '../../config/demo'
import { useStore } from '../../hooks/useStore'
import { useStoreConfig } from '../../hooks/useStoreConfig'

export function AdminLayout() {
  const { user, loading } = useAuth()
  const { storeId, path } = useStore()
  const { config } = useStoreConfig()
  const demoPreview = isDemoMode()

  if (loading) return <LoadingSpinner />

  if (!demoPreview && (!user || !isStoreAdmin(user, storeId))) {
    return <Navigate to={path('admin/login')} replace />
  }

  const nav = [
    { to: path('admin'), label: 'Dashboard', end: true },
    { to: path('admin/productos'), label: 'Productos' },
    { to: path('admin/categorias'), label: 'Categorías' },
    { to: path('admin/pedidos'), label: 'Pedidos' },
    { to: path('admin/facturacion'), label: 'Facturación' },
    { to: path('admin/config'), label: 'Configuración' },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <DemoBanner />
      <div className="flex flex-1">
        <aside className="w-56 border-r border-gray-200 bg-white p-4">
          <h2 className="mb-1 text-lg font-bold text-brand-700">Panel Admin</h2>
          <p className="mb-6 text-xs text-gray-500">{config.name}</p>
          <nav className="space-y-1">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-2 text-sm ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-medium'
                      : 'text-gray-700 hover:bg-brand-50 hover:text-brand-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 border-t pt-4">
            <Link
              to={path()}
              className="block px-3 py-2 text-sm text-gray-500 hover:text-brand-600"
            >
              Ver tienda
            </Link>
            <Link to="/" className="block px-3 py-2 text-sm text-gray-500 hover:text-brand-600">
              Todas las tiendas
            </Link>
            <button
              onClick={() => logOut()}
              className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
