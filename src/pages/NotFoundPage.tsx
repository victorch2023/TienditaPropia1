import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-gray-600">
        La ruta que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="mt-8 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
