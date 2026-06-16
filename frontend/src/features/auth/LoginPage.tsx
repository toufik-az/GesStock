import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/auth/useAuth'
import { Input }   from '@/components/ui/Input'
import { Button }  from '@/components/ui/Button'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate   = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-content-bg px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar">
            <span className="font-display text-lg font-bold text-white">GS</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-encre">Connexion</h1>
          <p className="mt-1 text-sm text-muted">Gestion de stock pour votre magasin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-card">
          <Input
            label="Adresse e-mail"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="gerant@monmagasin.dz"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="rounded-lg bg-cta-light px-3 py-2 text-sm text-cta">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={loading} size="lg">
            Se connecter
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Nouveau magasin ?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
