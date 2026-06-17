import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useStoreConfig } from '../../hooks/useStoreConfig'

export function HomePage() {
  const { products, loading } = useProducts(true)
  const { categories } = useCategories()
  const { config } = useStoreConfig()

  const featured = products.slice(0, 8)

  return (
    <div>
      <section className="mb-10 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-12 text-white">
        <h1 className="text-3xl font-bold md:text-4xl">Bienvenido a {config.name}</h1>
        <p className="mt-3 max-w-xl text-brand-100">
          {config.description || 'Compra en línea con envío en Lima Metropolitana'}
        </p>
        <Link
          to="/catalogo"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-medium text-brand-700 hover:bg-brand-50"
        >
          Ver catálogo
        </Link>
      </section>

      {categories.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Categorías</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogo?categoria=${cat.slug}`}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm hover:border-brand-500 hover:text-brand-600"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Productos destacados</h2>
          <Link to="/catalogo" className="text-sm text-brand-600 hover:underline">
            Ver todos
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : featured.length === 0 ? (
          <p className="text-gray-500">Aún no hay productos disponibles.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
