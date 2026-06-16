import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth }  from '@/auth/useAuth'
import { Input }    from '@/components/ui/Input'
import { Button }   from '@/components/ui/Button'
import { API_URL }  from '@/lib/constants'

export function RegisterPage() {
  const { signIn }    = useAuth()
  const navigate      = useNavigate()
  const [form,  setForm]   = useState({ email: '', password: '', nom_magasin: '', nom_gerant: '' })
  const [error, setError]  = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur lors de la création du compte')

      // Sign in automatically after account creation
      await signIn(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-content-bg px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar">
            <span className="font-display text-lg font-bold text-white">GS</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-encre">Créer votre magasin</h1>
          <p className="mt-1 text-sm text-muted">Compte gérant + espace multi-utilisateurs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-card">
          <Input
            label="Nom du magasin"
            value={form.nom_magasin}
            onChange={set('nom_magasin')}
            required
            placeholder="Épicerie Al-Baraka"
          />
          <Input
            label="Votre nom"
            value={form.nom_gerant}
            onChange={set('nom_gerant')}
            required
            placeholder="Mohamed Benali"
          />
          <Input
            label="Adresse e-mail"
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
            placeholder="gerant@exemple.dz"
          />
          <Input
            label="Mot de passe"
            type="password"
            value={form.password}
            onChange={set('password')}
            required
            autoComplete="new-password"
            placeholder="Au moins 6 caractères"
          />

          {error && (
            <p className="rounded-lg bg-cta-light px-3 py-2 text-sm text-cta">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={loading} size="lg">
            Créer le compte
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          Déjà inscrit ?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
