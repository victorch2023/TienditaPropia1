import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { DriveImage } from '../../components/DriveImage'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categorySlug = searchParams.get('categoria')
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const { products, loading } = useProducts(true)
  const { categories } = useCategories()

  const activeCategory = useMemo(
    () => (categorySlug ? categories.find((c) => c.slug === categorySlug) : undefined),
    [categories, categorySlug]
  )

  const filtered = useMemo(() => {
    let result = products
    if (activeCategory) {
      result = result.filter((p) => p.categoryId === activeCategory.id)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (maxPrice) {
      const max = Math.round(parseFloat(maxPrice) * 100)
      if (!isNaN(max)) result = result.filter((p) => p.price <= max)
    }
    return result
  }, [products, activeCategory, search, maxPrice])

  return (
    <div>
      {activeCategory?.bannerUrl?.trim() ? (
        <section className="relative mb-6 overflow-hidden rounded-xl">
          <DriveImage
            src={activeCategory.bannerUrl}
            alt=""
            className="h-32 w-full object-cover md:h-40"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent px-6 pb-4">
            <h1 className="text-2xl font-bold text-white">{activeCategory.name}</h1>
          </div>
        </section>
      ) : (
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Catálogo</h1>
      )}

      <div className="mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <select
          value={categorySlug || ''}
          onChange={(e) => {
            if (e.target.value) {
              setSearchParams({ categoria: e.target.value })
            } else {
              setSearchParams({})
            }
          }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="Precio máx. (S/)"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm md:w-40"
          min="0"
          step="0.01"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No se encontraron productos.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
