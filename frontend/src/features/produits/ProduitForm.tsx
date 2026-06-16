import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { supabase }  from '@/lib/supabaseClient'
import { UNITES, PALETTE_CATEGORIES } from '@/lib/constants'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import { Select }    from '@/components/ui/Select'
import { Card }      from '@/components/ui/Card'
import { Modal }     from '@/components/ui/Modal'
import { Spinner }   from '@/components/ui/Spinner'
import type { Produit, Categorie } from '@/types/db'

export function ProduitForm() {
  const { id }    = useParams<{ id?: string }>()
  const isEdit    = Boolean(id)
  const navigate  = useNavigate()
  const qc        = useQueryClient()

  const [form, setForm] = useState({
    nom: '', code_barre: '', categorie_id: '',
    prix_achat: '', prix_vente: '',
    quantite: '', quantite_min: '5',
    unite: 'Pièce',
  })
  const [errors,     setErrors]     = useState<Record<string, string>>({})
  const [confirmDel, setConfirmDel] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [showCatDlg, setShowCatDlg] = useState(false)

  const { data: categories = [], refetch: refetchCats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('nom')
      if (error) throw error
      return data as Categorie[]
    },
  })

  const { isLoading } = useQuery({
    queryKey: ['produit', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Produit
    },
    onSuccess: (p: Produit) => {
      setForm({
        nom:          p.nom,
        code_barre:   p.code_barre ?? '',
        categorie_id: p.categorie_id ?? '',
        prix_achat:   String(p.prix_achat),
        prix_vente:   String(p.prix_vente),
        quantite:     String(p.quantite),
        quantite_min: String(p.quantite_min),
        unite:        p.unite,
      })
    },
  } as Parameters<typeof useQuery>[0])

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.nom.trim()) errs.nom = 'Champ obligatoire'
    if (!form.prix_vente || isNaN(Number(form.prix_vente))) errs.prix_vente = 'Valeur invalide'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        nom:          form.nom.trim(),
        code_barre:   form.code_barre.trim() || null,
        categorie_id: form.categorie_id || null,
        prix_achat:   Number(form.prix_achat) || 0,
        prix_vente:   Number(form.prix_vente),
        quantite:     Number(form.quantite) || 0,
        quantite_min: Number(form.quantite_min) || 5,
        unite:        form.unite,
      }
      if (isEdit) {
        const { error } = await supabase.from('produits').update(payload).eq('id', id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from('produits').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produits'] })
      navigate('/produits')
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Erreur'
      if (msg.includes('produits_code_barre')) {
        setErrors(e => ({ ...e, code_barre: 'Ce code-barres existe déjà' }))
      } else {
        setErrors(e => ({ ...e, _: msg }))
      }
    },
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('produits').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['produits'] })
      navigate('/produits')
    },
  })

  const createCat = async () => {
    if (!newCatName.trim()) return
    const couleur = PALETTE_CATEGORIES[categories.length % PALETTE_CATEGORIES.length]
    const { data, error } = await supabase
      .from('categories')
      .insert({ nom: newCatName.trim(), couleur })
      .select()
      .single()
    if (!error && data) {
      await refetchCats()
      setForm(prev => ({ ...prev, categorie_id: data.id }))
    }
    setNewCatName('')
    setShowCatDlg(false)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (validate()) saveMut.mutate()
  }

  if (isEdit && isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="mx-auto max-w-xl">
      <form onSubmit={handleSubmit}>
        <Card>
          <div className="space-y-4">
            <Input label="Nom du produit" value={form.nom} onChange={set('nom')} error={errors.nom} required />

            <Input
              label="Code-barres (optionnel)"
              value={form.code_barre}
              onChange={set('code_barre')}
              error={errors.code_barre}
              placeholder="EAN-13…"
            />

            <div className="flex gap-2 items-end">
              <Select label="Catégorie" value={form.categorie_id} onChange={set('categorie_id')} className="flex-1">
                <option value="">Sans catégorie</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </Select>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCatDlg(true)}>
                + Nouvelle
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Prix d'achat (DA)" type="number" min="0" step="any" value={form.prix_achat} onChange={set('prix_achat')} />
              <Input label="Prix de vente (DA)" type="number" min="0" step="any" value={form.prix_vente} onChange={set('prix_vente')} error={errors.prix_vente} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input label="Quantité en stock" type="number" min="0" step="any" value={form.quantite} onChange={set('quantite')} />
              <Input label="Quantité minimale" type="number" min="0" step="any" value={form.quantite_min} onChange={set('quantite_min')} />
            </div>

            <Select label="Unité" value={form.unite} onChange={set('unite')}>
              {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
            </Select>

            {errors._ && (
              <p className="rounded-lg bg-cta-light px-3 py-2 text-sm text-cta">{errors._}</p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            {isEdit ? (
              <Button type="button" variant="danger" size="sm" onClick={() => setConfirmDel(true)}>
                <Trash2 className="h-4 w-4" /> Supprimer
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => navigate('/produits')}>Annuler</Button>
              <Button type="submit" loading={saveMut.isPending}>Enregistrer</Button>
            </div>
          </div>
        </Card>
      </form>

      {/* Confirm delete */}
      <Modal open={confirmDel} onClose={() => setConfirmDel(false)} title="Supprimer le produit">
        <p className="text-sm text-muted mb-4">Cette action est irréversible.</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmDel(false)}>Annuler</Button>
          <Button variant="cta" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>
            Supprimer
          </Button>
        </div>
      </Modal>

      {/* New category */}
      <Modal open={showCatDlg} onClose={() => setShowCatDlg(false)} title="Nouvelle catégorie">
        <Input
          label="Nom de la catégorie"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); createCat() } }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowCatDlg(false)}>Annuler</Button>
          <Button onClick={createCat}>Créer</Button>
        </div>
      </Modal>
    </div>
  )
}
