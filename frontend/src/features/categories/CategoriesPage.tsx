import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { supabase }          from '@/lib/supabaseClient'
import { PALETTE_CATEGORIES } from '@/lib/constants'
import { Button }            from '@/components/ui/Button'
import { Card }              from '@/components/ui/Card'
import { Modal }             from '@/components/ui/Modal'
import { Input }             from '@/components/ui/Input'
import { EmptyState }        from '@/components/ui/EmptyState'
import { Spinner }           from '@/components/ui/Spinner'
import type { Categorie }    from '@/types/db'

interface CategorieAvecNombre extends Categorie { nb_produits: number }

export function CategoriesPage() {
  const qc = useQueryClient()
  const [showAdd,   setShowAdd]   = useState(false)
  const [editing,   setEditing]   = useState<Categorie | null>(null)
  const [toDelete,  setToDelete]  = useState<Categorie | null>(null)
  const [nomInput,  setNomInput]  = useState('')

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories-avec-nb'],
    queryFn: async () => {
      const { data: cats, error } = await supabase.from('categories').select('*').order('nom')
      if (error) throw error

      // Count products per category in a single query
      const { data: counts } = await supabase
        .from('produits')
        .select('categorie_id')
      const countMap: Record<string, number> = {}
      ;(counts ?? []).forEach(row => {
        if (row.categorie_id) countMap[row.categorie_id] = (countMap[row.categorie_id] ?? 0) + 1
      })

      return (cats as Categorie[]).map(c => ({ ...c, nb_produits: countMap[c.id] ?? 0 }))
    },
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['categories'] })
    qc.invalidateQueries({ queryKey: ['categories-avec-nb'] })
  }

  const addMut = useMutation({
    mutationFn: async (nom: string) => {
      const couleur = PALETTE_CATEGORIES[categories.length % PALETTE_CATEGORIES.length]
      const { error } = await supabase.from('categories').insert({ nom: nom.trim(), couleur })
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setShowAdd(false); setNomInput('') },
  })

  const editMut = useMutation({
    mutationFn: async (nom: string) => {
      const { error } = await supabase.from('categories').update({ nom: nom.trim() }).eq('id', editing!.id)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setEditing(null); setNomInput('') },
  })

  const deleteMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('categories').delete().eq('id', toDelete!.id)
      if (error) throw error
    },
    onSuccess: () => { invalidate(); setToDelete(null) },
  })

  const openEdit = (c: Categorie) => { setEditing(c); setNomInput(c.nom) }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => { setShowAdd(true); setNomInput('') }}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          message="Aucune catégorie. Ajoutez-en une pour organiser vos produits."
        />
      ) : (
        <Card padding={false}>
          <ul className="divide-y divide-gray-50">
            {(categories as CategorieAvecNombre[]).map(c => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: c.couleur }}
                  />
                  <span className="text-sm font-medium text-encre">{c.nom}</span>
                  <span className="text-xs text-muted">{c.nb_produits} produit(s)</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-encre"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setToDelete(c)}
                    className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-cta"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Add */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Nouvelle catégorie">
        <Input
          label="Nom"
          value={nomInput}
          onChange={e => setNomInput(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMut.mutate(nomInput) } }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setShowAdd(false)}>Annuler</Button>
          <Button loading={addMut.isPending} onClick={() => addMut.mutate(nomInput)}>Créer</Button>
        </div>
      </Modal>

      {/* Edit */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title="Renommer la catégorie">
        <Input
          label="Nouveau nom"
          value={nomInput}
          onChange={e => setNomInput(e.target.value)}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); editMut.mutate(nomInput) } }}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
          <Button loading={editMut.isPending} onClick={() => editMut.mutate(nomInput)}>Enregistrer</Button>
        </div>
      </Modal>

      {/* Delete */}
      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Supprimer la catégorie">
        <p className="text-sm text-muted">
          Supprimer <strong>«&nbsp;{toDelete?.nom}&nbsp;»</strong> ? Les produits associés seront conservés.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToDelete(null)}>Annuler</Button>
          <Button variant="cta" loading={deleteMut.isPending} onClick={() => deleteMut.mutate()}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  )
}
