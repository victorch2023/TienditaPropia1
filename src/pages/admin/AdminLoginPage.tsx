import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, isStoreAdmin } from '../../services/auth'
import { useAuth } from '../../hooks/useAuth'
import { useStore } from '../../hooks/useStore'
import { useStoreConfig } from '../../hooks/useStoreConfig'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { isDemoMode } from '../../config/demo'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { storeId, path } = useStore()
  const { config } = useStoreConfig()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && isStoreAdmin(user, storeId)) {
      navigate(path('admin'))
    }
  }, [user, navigate, storeId, path])

  if (loading) return <LoadingSpinner />
  if (user && isStoreAdmin(user, storeId)) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const profile = await signIn(email, password)
      if (!isStoreAdmin(profile, storeId)) {
        setError(
          profile.role === 'admin'
            ? `No tienes permisos de admin para esta tienda (${storeId}). Añade "${storeId}" en users.adminStores.`
            : 'No tienes permisos de administrador'
        )
        return
      }
      navigate(path('admin'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Admin — {config.name}</h1>
        <p className="mb-6 text-xs text-gray-500">Tienda: {storeId}</p>
        {isDemoMode() && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Modo demo: puedes{' '}
            <Link to={path('admin')} className="font-medium underline">
              explorar el panel
            </Link>{' '}
            sin iniciar sesión.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        <div className="relative mb-6">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 pr-10 text-sm"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-6.5 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19" />
                <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 py-3 text-white hover:bg-brand-700"
        >
          Iniciar sesión
        </button>
      </form>
    </div>
  )
}
