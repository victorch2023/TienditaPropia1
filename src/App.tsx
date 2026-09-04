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
import {
  getRouterBasename,
  getStoreIdFromHostname,
} from './config/domains'

const domainStoreId =
  typeof window !== 'undefined'
    ? getStoreIdFromHostname(window.location.hostname)
    : null

const basename = getRouterBasename()

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

/** En dominio custom: `/s/citroleaf/catalogo` → `/catalogo` */
function CustomDomainStorePrefixRedirect({
  expectedStoreId,
}: {
  expectedStoreId: string
}) {
  const { storeId, '*': rest } = useParams()
  const suffix = rest ? `/${rest}` : '/'
  if (storeId === expectedStoreId) {
    return <Navigate to={suffix} replace />
  }
  return <Navigate to="/" replace />
}

function StoreRoutes() {
  return (
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
  )
}

function StoreScope({
  storeId,
  rootPaths = false,
}: {
  storeId?: string
  rootPaths?: boolean
}) {
  return (
    <StoreProvider storeId={storeId} rootPaths={rootPaths}>
      <CartProvider>
        <StoreRoutes />
      </CartProvider>
    </StoreProvider>
  )
}

/** Dominio custom (citroleaf.com): tienda en `/`, `/catalogo`, `/admin`, … */
function CustomDomainApp({ storeId }: { storeId: string }) {
  return (
    <StoreProvider storeId={storeId} rootPaths>
      <CartProvider>
        <Routes>
          <Route
            path="s/:storeId/*"
            element={
              <CustomDomainStorePrefixRedirect expectedStoreId={storeId} />
            }
          />

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

/** github.io / local: selector + `/s/:storeId/*` */
function MultiStoreApp() {
  return (
    <Routes>
      <Route index element={<StorePickerPage />} />
      <Route path="tiendas" element={<StorePickerPage />} />
      <Route path="s/:storeId/*" element={<StoreScope />} />

      {/* Compatibilidad con URLs antiguas → tienda default */}
      <Route
        path="catalogo"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/catalogo`} replace />}
      />
      <Route path="producto/:id" element={<LegacyProductRedirect />} />
      <Route
        path="carrito"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/carrito`} replace />}
      />
      <Route
        path="checkout"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/checkout`} replace />}
      />
      <Route path="pedido/:id" element={<LegacyPedidoRedirect />} />
      <Route
        path="cuenta"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/cuenta`} replace />}
      />
      <Route
        path="admin/login"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/admin/login`} replace />}
      />
      <Route
        path="admin"
        element={<Navigate to={`/s/${DEFAULT_STORE_ID}/admin`} replace />}
      />
      <Route path="admin/*" element={<LegacyAdminRedirect />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        {domainStoreId ? (
          <CustomDomainApp storeId={domainStoreId} />
        ) : (
          <MultiStoreApp />
        )}
      </AuthProvider>
    </BrowserRouter>
  )
}
