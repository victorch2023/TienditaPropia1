import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../../services/auth'
import { useAuth } from '../../hooks/useAuth'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { isDemoMode } from '../../config/demo'
import { Link } from 'react-router-dom'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin')
    }
  }, [user, navigate])

  if (loading) return <LoadingSpinner />
  if (user?.role === 'admin') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const profile = await signIn(email, password)
      if (profile.role !== 'admin') {
        setError('No tienes permisos de administrador')
        return
      }
      navigate('/admin')
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
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin — Mi Tiendita</h1>
        {isDemoMode() && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Modo demo: puedes{' '}
            <Link to="/admin" className="font-medium underline">
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
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
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
