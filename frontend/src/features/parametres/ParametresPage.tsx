import { useState, useEffect } from 'react'
import { useNavigate }         from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Trash2, Plus } from 'lucide-react'
import { supabase }  from '@/lib/supabaseClient'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import { Card }      from '@/components/ui/Card'
import { Modal }     from '@/components/ui/Modal'
import { Spinner }   from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'

export function ParametresPage() {
  const navigate  = useNavigate()
  const qc        = useQueryClient()
  const [storeName, setStoreName] = useState('')
  const [saveOk,    setSaveOk]    = useState(false)
  const [demoOk,    setDemoOk]    = useState(false)
  const [demoConfirm, setDemoConfirm] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoError,   setDemoError]   = useState('')

  // Load fournisseurs
  const { data: fournisseurs = [], isLoading: fourLoad } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fournisseurs').select('*').order('nom')
      if (error) throw error
      return data
    },
  })

  // Load store name from context
  const { data: store } = useQuery({
    queryKey: ['store'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const storeId = user?.app_metadata?.store_id
      if (!storeId) return null
      const { data, error } = await supabase.from('stores').select('*').eq('id', storeId).single()
      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (store) setStoreName(store.nom)
  }, [store])

  const saveStore = async () => {
    if (!store) return
    await supabase.from('stores').update({ nom: storeName }).eq('id', store.id)
    qc.invalidateQueries({ queryKey: ['store'] })
    setSaveOk(true)
    setTimeout(() => setSaveOk(false), 2000)
  }

  // Fournisseur add/delete
  const [showAddFour, setShowAddFour] = useState(false)
  const [fourForm,    setFourForm]    = useState({ nom: '', telephone: '' })
  const [delFour,     setDelFour]     = useState<{ id: string; nom: string } | null>(null)

  const addFourMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('fournisseurs').insert({
        nom: fourForm.nom.trim(), telephone: fourForm.telephone.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fournisseurs'] })
      setShowAddFour(false)
      setFourForm({ nom: '', telephone: '' })
    },
  })

  const delFourMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('fournisseurs').delete().eq('id', delFour!.id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fournisseurs'] }); setDelFour(null) },
  })

  const chargerDemo = async () => {
    setDemoLoading(true)
    setDemoError('')
    try {
      const { error } = await supabase.rpc('charger_demo')
      if (error) throw error
      qc.invalidateQueries()
      setDemoConfirm(false)
      setDemoOk(true)
      setTimeout(() => setDemoOk(false), 3000)
    } catch (err: unknown) {
      setDemoError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setDemoLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Store name */}
      <Card>
        <h2 className="font-display text-sm font-semibold text-encre mb-4">Nom du magasin</h2>
        <div className="flex gap-3">
          <Input
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
            placeholder="Épicerie Al-Baraka"
            className="flex-1"
          />
          <Button onClick={saveStore}>
            {saveOk ? '✓ Enregistré' : 'Enregistrer'}
          </Button>
        </div>
      </Card>

      {/* Staff shortcut */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-encre">Personnel</h2>
            <p className="text-xs text-muted mt-0.5">Gérer les comptes caissiers</p>
          </div>
          <Button onClick={() => navigate('/parametres/staff')}>
            <Users className="h-4 w-4" /> Gérer
          </Button>
        </div>
      </Card>

      {/* Fournisseurs */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold text-encre">Fournisseurs</h2>
          <Button size="sm" onClick={() => setShowAddFour(true)}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>

        {fourLoad ? (
          <Spinner />
        ) : fournisseurs.length === 0 ? (
          <EmptyState message="Aucun fournisseur." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {fournisseurs.map((f: { id: string; nom: string; telephone: string }) => (
              <li key={f.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-encre">{f.nom}</p>
                  {f.telephone && <p className="text-xs text-muted font-mono">{f.telephone}</p>}
                </div>
                <button
                  onClick={() => setDelFour({ id: f.id, nom: f.nom })}
                  className="text-muted hover:text-cta"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Demo data */}
      <Card>
        <h2 className="font-display text-sm font-semibold text-encre mb-1">Données de démonstration</h2>
        <p className="text-xs text-muted mb-4">
          Charge des catégories, produits, fournisseurs et 7 jours de ventes exemples.
          Toutes les données existantes du magasin seront remplacées.
        </p>
        {demoOk && (
          <p className="text-sm text-success mb-3">✓ Données de démonstration chargées !</p>
        )}
        <Button variant="ghost" onClick={() => setDemoConfirm(true)}>
          Charger les données de démo
        </Button>
      </Card>

      {/* Add fournisseur modal */}
      <Modal open={showAddFour} onClose={() => setShowAddFour(false)} title="Ajouter un fournisseur">
        <div className="space-y-3">
          <Input label="Nom" value={fourForm.nom} onChange={e => setFourForm(p => ({ ...p, nom: e.target.value }))} autoFocus />
          <Input label="Téléphone" value={fourForm.telephone} onChange={e => setFourForm(p => ({ ...p, telephone: e.target.value }))} />
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowAddFour(false)}>Annuler</Button>
            <Button loading={addFourMut.isPending} onClick={() => addFourMut.mutate()}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      {/* Delete fournisseur confirm */}
      <Modal open={Boolean(delFour)} onClose={() => setDelFour(null)} title="Supprimer le fournisseur">
        <p className="text-sm text-muted">Supprimer «&nbsp;{delFour?.nom}&nbsp;» ?</p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDelFour(null)}>Annuler</Button>
          <Button variant="cta" loading={delFourMut.isPending} onClick={() => delFourMut.mutate()}>Supprimer</Button>
        </div>
      </Modal>

      {/* Demo confirm */}
      <Modal open={demoConfirm} onClose={() => setDemoConfirm(false)} title="Charger les données de démo">
        <p className="text-sm text-muted">
          Cette action remplacera toutes les données existantes (produits, catégories, ventes, etc.) de votre magasin par des données exemples.
        </p>
        {demoError && <p className="mt-2 text-xs text-cta">{demoError}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDemoConfirm(false)}>Annuler</Button>
          <Button variant="cta" loading={demoLoading} onClick={chargerDemo}>Confirmer</Button>
        </div>
      </Modal>
    </div>
  )
}
