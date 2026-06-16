import { useState }  from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuth }   from '@/auth/useAuth'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import { Card }      from '@/components/ui/Card'
import { Modal }     from '@/components/ui/Modal'
import { Badge }     from '@/components/ui/Badge'
import { Spinner }   from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { API_URL }   from '@/lib/constants'
import type { Profile } from '@/types/db'

export function StaffPage() {
  const { session } = useAuth()
  const qc          = useQueryClient()
  const [showAdd,   setShowAdd]   = useState(false)
  const [toDelete,  setToDelete]  = useState<Profile | null>(null)
  const [form, setForm] = useState({ email: '', password: '', nom: '' })
  const [formError, setFormError] = useState('')

  const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.access_token}`,
  })

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/staff`, { headers: headers() })
      if (!res.ok) throw new Error(await res.text())
      return res.json() as Promise<Profile[]>
    },
  })

  const addMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/staff`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur')
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setShowAdd(false)
      setForm({ email: '', password: '', nom: '' })
      setFormError('')
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Erreur')
    },
  })

  const toggleMut = useMutation({
    mutationFn: async (p: Profile) => {
      const res = await fetch(`${API_URL}/staff/${p.id}`, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ actif: !p.actif }),
      })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff'] }),
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/staff/${toDelete!.id}`, {
        method: 'DELETE',
        headers: headers(),
      })
      if (!res.ok) throw new Error(await res.text())
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff'] })
      setToDelete(null)
    },
  })

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => { setShowAdd(true); setFormError('') }}>
          <Plus className="h-4 w-4" /> Ajouter un caissier
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : staff.length === 0 ? (
        <EmptyState
          message="Aucun caissier. Ajoutez-en un pour qu'il puisse accéder à la caisse."
          action={<Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" /> Ajouter</Button>}
        />
      ) : (
        <Card padding={false}>
          <ul className="divide-y divide-gray-50">
            {staff.map(p => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-encre">{p.nom}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={p.actif ? 'success' : 'default'}>
                      {p.actif ? 'Actif' : 'Désactivé'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMut.mutate(p)}
                    title={p.actif ? 'Désactiver' : 'Activer'}
                    className="text-muted hover:text-encre transition-colors"
                  >
                    {p.actif
                      ? <ToggleRight className="h-5 w-5 text-success" />
                      : <ToggleLeft  className="h-5 w-5" />
                    }
                  </button>
                  <button
                    onClick={() => setToDelete(p)}
                    className="text-muted hover:text-cta transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Add modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouveau caissier">
        <div className="space-y-3">
          <Input label="Nom" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} autoFocus required />
          <Input label="Adresse e-mail" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          <Input label="Mot de passe" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required placeholder="Min. 6 caractères" />
          {formError && <p className="text-xs text-cta">{formError}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button loading={addMut.isPending} onClick={() => addMut.mutate()}>Créer le compte</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Supprimer le caissier">
        <p className="text-sm text-muted">
          Supprimer le compte de <strong>{toDelete?.nom}</strong> ? Cette action est irréversible.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>Annuler</Button>
          <Button variant="cta" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  )
}
