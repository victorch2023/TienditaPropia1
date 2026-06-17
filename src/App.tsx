import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { StoreLayout } from './components/StoreLayout'
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

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/TienditaPropia1'

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}
