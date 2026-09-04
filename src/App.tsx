import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { StoreProvider } from './hooks/useStore'
import { StoreLayout } from './components/StoreLayout'
import { StorePickerPage } from './pages/StorePickerPage'
import { HomePage } from './pages/store/HomePage'
import { CatalogPage } from './pages/store/CatalogPage'
import { ProductPage } from './pages/store/ProductPage'
import { CartPage } from './pages/store/CartPage'
import { CheckoutPage } from './pages/store/CheckoutPage'
import { OrderConfirmPage } from './pages/store/OrderConfirmPage'
import { AccountPage } from './pages/store/AccountPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminProductsPage } from './pages/admin/AdminProductsPage'
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage'
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage'
import { AdminConfigPage } from './pages/admin/AdminConfigPage'
import { AdminBillingPage } from './pages/admin/AdminBillingPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { DEFAULT_STORE_ID } from './config/stores'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/TienditaPropia1'

function LegacyProductRedirect() {
  const { id } = useParams()
  return <Navigate to={`/s/${DEFAULT_STORE_ID}/producto/${id}`} replace />
}

function LegacyPedidoRedirect() {
  const { id } = useParams()
  return <Navigate to={`/s/${DEFAULT_STORE_ID}/pedido/${id}`} replace />
}

function LegacyAdminRedirect() {
  const { '*': rest } = useParams()
  const suffix = rest ? `/${rest}` : ''
  return <Navigate to={`/s/${DEFAULT_STORE_ID}/admin${suffix}`} replace />
}

function StoreScope() {
  return (
    <StoreProvider>
      <CartProvider>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalogo" element={<CatalogPage />} />
            <Route path="producto/:id" element={<ProductPage />} />
            <Route path="carrito" element={<CartPage />} />
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="pedido/:id" element={<OrderConfirmPage />} />
            <Route path="cuenta" element={<AccountPage />} />
          </Route>

          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="productos" element={<AdminProductsPage />} />
            <Route path="categorias" element={<AdminCategoriesPage />} />
            <Route path="pedidos" element={<AdminOrdersPage />} />
            <Route path="facturacion" element={<AdminBillingPage />} />
            <Route path="config" element={<AdminConfigPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <Routes>
          <Route index element={<StorePickerPage />} />
          <Route path="tiendas" element={<StorePickerPage />} />
          <Route path="s/:storeId/*" element={<StoreScope />} />

          {/* Compatibilidad con URLs antiguas → tienda default */}
          <Route path="catalogo" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/catalogo`} replace />} />
          <Route path="producto/:id" element={<LegacyProductRedirect />} />
          <Route path="carrito" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/carrito`} replace />} />
          <Route path="checkout" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/checkout`} replace />} />
          <Route path="pedido/:id" element={<LegacyPedidoRedirect />} />
          <Route path="cuenta" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/cuenta`} replace />} />
          <Route path="admin/login" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/admin/login`} replace />} />
          <Route path="admin" element={<Navigate to={`/s/${DEFAULT_STORE_ID}/admin`} replace />} />
          <Route path="admin/*" element={<LegacyAdminRedirect />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
