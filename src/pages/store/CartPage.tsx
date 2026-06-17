import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useStoreConfig } from '../../hooks/useStoreConfig'
import { formatSoles, calculateTotal } from '../../utils/money'
import { toDirectImageUrl } from '../../utils/driveImageUrl'

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()
  const { config } = useStoreConfig()
  const totals = calculateTotal(subtotal, config.shippingDefault, config.igvRate)

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Tu carrito está vacío</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-brand-600 hover:underline">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Carrito</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantName || ''}`}
              className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4"
            >
              {item.imageUrl && (
                <img
                  src={toDirectImageUrl(item.imageUrl)}
                  alt=""
                  className="h-20 w-20 rounded object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                {item.variantName && (
                  <p className="text-sm text-gray-500">{item.variantName}</p>
                )}
                <p className="mt-1 font-bold text-brand-600">{formatSoles(item.price)}</p>
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1, item.variantName)
                    }
                    className="rounded border px-2 py-1 text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1, item.variantName)
                    }
                    className="rounded border px-2 py-1 text-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.productId, item.variantName)}
                    className="ml-auto text-sm text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 h-fit">
          <h2 className="font-semibold text-gray-900">Resumen</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd>{formatSoles(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">IGV ({(config.igvRate * 100).toFixed(0)}%)</dt>
              <dd>{formatSoles(totals.igv)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Envío (estimado)</dt>
              <dd>{formatSoles(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold">
              <dt>Total</dt>
              <dd className="text-brand-600">{formatSoles(totals.total)}</dd>
            </div>
          </dl>
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-lg bg-brand-600 py-3 text-center font-medium text-white hover:bg-brand-700"
          >
            Proceder al pago
          </Link>
        </div>
      </div>
    </div>
  )
}
