import { useStoreConfig } from '../hooks/useStoreConfig'

export function Footer() {
  const { config } = useStoreConfig()

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-semibold text-gray-900">{config.name}</h3>
            <p className="mt-2 text-sm text-gray-600">
              {config.description || 'Envíos solo en Lima Metropolitana'}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Envíos</h3>
            <p className="mt-2 text-sm text-gray-600">
              Entregas en los 43 distritos de Lima Metropolitana
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Pagos</h3>
            <p className="mt-2 text-sm text-gray-600">
              Yape, Plin y transferencias bancarias (PEN)
            </p>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {config.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
