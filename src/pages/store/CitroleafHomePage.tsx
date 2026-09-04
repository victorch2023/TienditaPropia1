import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useStore } from '../../hooks/useStore'
import { useStoreConfig } from '../../hooks/useStoreConfig'

const HERO_LEAF =
  'https://images.unsplash.com/photo-1466692476862-a44231189ab9?w=900&h=1100&fit=crop'
const HERO_CITRUS =
  'https://images.unsplash.com/photo-1590502593747-42a996133562?w=700&h=900&fit=crop'
const LIFESTYLE =
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&h=900&fit=crop'
const TILE_NEW =
  'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&h=700&fit=crop'
const TILE_SHOP =
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=700&fit=crop'
const TILE_KITS =
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=700&fit=crop'

function Marquee({ text }: { text: string }) {
  const strip = Array.from({ length: 8 }, () => text).join(' ')
  return (
    <div className="overflow-hidden bg-[#261F1A] py-3 text-[#F2F0EB]">
      <div className="citro-marquee flex whitespace-nowrap text-[11px] uppercase tracking-[0.28em]">
        <span className="px-4">{strip}</span>
        <span className="px-4" aria-hidden>
          {strip}
        </span>
      </div>
    </div>
  )
}

export function CitroleafHomePage() {
  const { products, loading } = useProducts(true)
  const { categories } = useCategories()
  const { config } = useStoreConfig()
  const { path } = useStore()
  const featured = products.slice(0, 4)

  return (
    <div className="-mx-4 -my-6 bg-[#F2F0EB] text-[#261F1A] md:-mx-4">
      {/* Hero split */}
      <section className="citro-fade-in grid min-h-[70vh] md:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden md:min-h-0">
          <img
            src={HERO_LEAF}
            alt="Hojas y naturaleza Citroleaf"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-[#261F1A]/15" />
        </div>
        <div className="relative flex flex-col justify-center gap-6 px-8 py-16 md:px-14">
          <img
            src={HERO_CITRUS}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
          />
          <div className="relative">
            <p className="mb-3 text-[11px] uppercase tracking-[0.3em] text-[#261F1A]/70">
              Lima · Protección orgánica
            </p>
            <h1 className="font-citro-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">
              Citroleaf
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[#261F1A]/80 md:text-base">
              {config.description ||
                'Protección natural para tu piel y para tu planeta.'}
            </p>
            <Link
              to={path('catalogo')}
              className="mt-8 inline-block bg-[#261F1A] px-8 py-3.5 text-[11px] font-medium uppercase tracking-[0.25em] text-[#F2F0EB] transition hover:bg-[#3d342c]"
            >
              Shop now
            </Link>
          </div>
        </div>
      </section>

      <Marquee text="Citronella natural • Hierba luisa • Protección orgánica •" />

      {/* Intro */}
      <section className="citro-fade-in mx-auto max-w-2xl px-6 py-16 text-center md:py-20">
        <h2 className="font-citro-serif text-3xl md:text-4xl">
          Protección natural para tu piel
        </h2>
        <p className="mt-5 text-sm leading-relaxed text-[#261F1A]/75 md:text-base">
          Repelentes de origen vegetal inspirados en la citronela y la hierba luisa.
          Pensados en Lima, para que los zancudos no interrumpan tus noches — ni tu
          compromiso con el planeta.
        </p>
      </section>

      {/* Products */}
      <section className="px-4 pb-16 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="font-citro-serif text-3xl md:text-4xl">Lo esencial</h2>
          <Link
            to={path('catalogo')}
            className="text-[11px] uppercase tracking-[0.22em] text-[#261F1A]/70 underline-offset-4 hover:underline"
          >
            Ver todo
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <ProductCard product={p} variant="citroleaf" />
              </div>
            ))}
          </div>
        )}
      </section>

      <Marquee text="Guardians of nature • Citroleaf Lima •" />

      {/* Lifestyle banner */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden">
        <img
          src={LIFESTYLE}
          alt="Naturaleza y hojas"
          className="absolute inset-0 h-full w-full object-cover brightness-75 grayscale-[30%] transition duration-[1.2s] hover:scale-105"
        />
        <div className="relative z-10 px-6 text-center text-[#F2F0EB]">
          <h2 className="font-citro-serif text-3xl md:text-5xl">
            Para pieles reales y noches tranquilas
          </h2>
          <Link
            to={path('catalogo')}
            className="mt-8 inline-block border border-[#F2F0EB] px-8 py-3 text-[11px] uppercase tracking-[0.25em] transition hover:bg-[#F2F0EB] hover:text-[#261F1A]"
          >
            Shop now
          </Link>
        </div>
      </section>

      {/* Dark category tiles */}
      <section className="grid gap-3 bg-[#F2F0EB] p-4 md:grid-cols-3 md:gap-4 md:p-8">
        {[
          {
            label: 'New',
            href: path('catalogo'),
            img: TILE_NEW,
            sub: categories[0]?.name || 'Novedades',
          },
          {
            label: 'Shop',
            href: path('catalogo?categoria=repelentes'),
            img: TILE_SHOP,
            sub: 'Repelentes',
          },
          {
            label: 'Kits',
            href: path('catalogo?categoria=kits'),
            img: TILE_KITS,
            sub: 'Packs',
          },
        ].map((tile) => (
          <Link
            key={tile.label}
            to={tile.href}
            className="group relative flex min-h-[280px] items-center justify-center overflow-hidden bg-[#261F1A]"
          >
            <img
              src={tile.img}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-110 group-hover:opacity-40"
            />
            <div className="relative z-10 text-center text-[#F2F0EB]">
              <span className="font-citro-serif text-4xl md:text-5xl">{tile.label}</span>
              <p className="mt-2 text-[10px] uppercase tracking-[0.28em] opacity-80">
                {tile.sub}
              </p>
            </div>
          </Link>
        ))}
      </section>

      <footer className="border-t border-[#261F1A]/15 bg-[#F2F0EB] px-6 py-12 text-center">
        <p className="font-citro-serif text-2xl">{config.name}</p>
        <p className="mt-3 text-sm text-[#261F1A]/70">
          {config.description}
        </p>
        <a
          href="https://www.instagram.com/citroleaf__/"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-[11px] uppercase tracking-[0.22em] text-[#261F1A]/60 hover:text-[#261F1A]"
        >
          @citroleaf__
        </a>
        <p className="mt-8 text-xs text-[#261F1A]/45">
          © {new Date().getFullYear()} Citroleaf. Envíos en Lima Metropolitana.
        </p>
      </footer>
    </div>
  )
}
