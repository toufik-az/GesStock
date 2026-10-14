import { useState }   from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase }   from '@/lib/supabaseClient'
import { Modal }      from '@/components/ui/Modal'
import { Button }     from '@/components/ui/Button'
import { Input }      from '@/components/ui/Input'
import type { Produit } from '@/types/db'

interface Props {
  open:      boolean
  code:      string
  onClose:   () => void
  onCreated: (p: Produit) => void
}

export function QuickCreateDialog({ open, code, onClose, onCreated }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ nom: '', prix_achat: '', prix_vente: '' })
  const [error, setError] = useState('')

  const set = (f: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [f]: e.target.value }))

  const mut = useMutation({
    mutationFn: async () => {
      if (!form.nom.trim() || !form.prix_vente) throw new Error('Champs obligatoires manquants')
      const { data, error } = await supabase.rpc('creer_produit_rapide', {
        p_nom:        form.nom.trim(),
        p_code_barre: code || null,
        p_prix_achat: Number(form.prix_achat) || 0,
        p_prix_vente: Number(form.prix_vente),
      })
      if (error) throw error
      return data as Produit
    },
    onSuccess: produit => {
      qc.invalidateQueries({ queryKey: ['produits'] })
      setForm({ nom: '', prix_achat: '', prix_vente: '' })
      setError('')
      onCreated(produit)
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : 'Erreur')
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Créer rapidement un produit" maxWidth="max-w-sm">
      <div className="space-y-3">
        {code && (
          <p className="font-mono text-xs text-muted">Code : {code}</p>
        )}
        <Input label="Nom du produit" value={form.nom} onChange={set('nom')} autoFocus required />
        <Input label="Prix d'achat (DA)" type="number" min="0" step="any" value={form.prix_achat} onChange={set('prix_achat')} />
        <Input label="Prix de vente (DA)" type="number" min="0" step="any" value={form.prix_vente} onChange={set('prix_vente')} required />
        {error && <p className="text-xs text-cta">{error}</p>}
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button className="flex-1" loading={mut.isPending} onClick={() => mut.mutate()}>Créer & ajouter</Button>
        </div>
      </div>
    </Modal>
  )
}
