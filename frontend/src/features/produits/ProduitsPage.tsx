import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Package, Pencil } from 'lucide-react'
import { supabase }     from '@/lib/supabaseClient'
import { versDa, versQte } from '@/lib/format'
import { Button }       from '@/components/ui/Button'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Spinner }      from '@/components/ui/Spinner'
import { EmptyState }   from '@/components/ui/EmptyState'
import type { Produit, Categorie } from '@/types/db'

export function ProduitsPage() {
  const navigate     = useNavigate()
  const qc           = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('categories').select('*').order('nom')
      if (error) throw error
      return data as Categorie[]
    },
  })

  const { data: produits = [], isLoading } = useQuery({
    queryKey: ['produits', search],
    queryFn: async () => {
      let q = supabase.from('produits').select('*').order('nom')
      if (search.trim()) {
        q = q.or(`nom.ilike.%${search.trim()}%,code_barre.ilike.%${search.trim()}%`)
      }
      const { data, error } = await q
      if (error) throw error
      return data as Produit[]
    },
  })

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))

  const isAlerte = (p: Produit) => p.quantite <= p.quantite_min

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); qc.cancelQueries({ queryKey: ['produits'] }) }}
            placeholder="Rechercher (nom ou code-barres)…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button onClick={() => navigate('/produits/nouveau')}>
          <Plus className="h-4 w-4" /> Ajouter
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : produits.length === 0 ? (
        <EmptyState
          icon={<Package className="h-12 w-12" />}
          message={search ? 'Aucun produit trouvé pour cette recherche.' : 'Aucun produit. Commencez par en ajouter un.'}
          action={!search ? <Button onClick={() => navigate('/produits/nouveau')}><Plus className="h-4 w-4" /> Ajouter un produit</Button> : undefined}
        />
      ) : (
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">P. achat</th>
                <th className="px-4 py-3 text-right">P. vente</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produits.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-encre">{p.nom}</div>
                    {p.code_barre && (
                      <div className="font-mono text-xs text-muted">{p.code_barre}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.categorie_id && catMap[p.categorie_id] ? (
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ background: catMap[p.categorie_id].couleur }}
                      >
                        {catMap[p.categorie_id].nom}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                    {versDa(p.prix_achat)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-encre">
                    {versDa(p.prix_vente)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-sm tabular-nums ${isAlerte(p) ? 'text-cta font-semibold' : 'text-encre'}`}>
                      {versQte(p.quantite)}&nbsp;{p.unite}
                    </span>
                    {isAlerte(p) && (
                      <Badge variant="danger" className="ml-2">Alerte</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigate(`/produits/${p.id}`)}
                      className="rounded-lg p-1.5 text-muted hover:bg-gray-100 hover:text-encre transition-colors"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
