import { useNavigate }  from 'react-router-dom'
import { useQuery }      from '@tanstack/react-query'
import { AlertTriangle, Truck } from 'lucide-react'
import { supabase }     from '@/lib/supabaseClient'
import { versDa, versQte } from '@/lib/format'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Button }       from '@/components/ui/Button'
import { EmptyState }   from '@/components/ui/EmptyState'
import { Spinner }      from '@/components/ui/Spinner'
import type { Produit } from '@/types/db'

type ProduitWithCat = Produit & { categories: { nom: string; couleur: string } | null }

export function AlertesPage() {
  const navigate = useNavigate()

  const { data: produits = [], isLoading } = useQuery({
    queryKey: ['alertes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produits')
        .select('*, categories(nom, couleur)')
        .order('quantite', { ascending: true })
      if (error) throw error
      return (data ?? []).filter(
        (p: Produit) => p.quantite <= p.quantite_min
      ) as ProduitWithCat[]
    },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {isLoading ? '…' : `${produits.length} produit(s) en dessous du seuil d'alerte`}
        </p>
        <Button onClick={() => navigate('/reception')}>
          <Truck className="h-4 w-4" /> Réceptionner
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : produits.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          message="Aucun produit en alerte. Bon travail !"
        />
      ) : (
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Produit</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Stock actuel</th>
                <th className="px-4 py-3 text-right">Seuil min.</th>
                <th className="px-4 py-3 text-right">P. vente</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {produits.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-encre">{p.nom}</div>
                    {p.code_barre && <div className="font-mono text-xs text-muted">{p.code_barre}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {p.categories ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: p.categories.couleur }}>
                        {p.categories.nom}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-sm tabular-nums text-cta font-semibold">
                      {versQte(p.quantite)}&nbsp;{p.unite}
                    </span>
                    <Badge variant="danger" className="ml-1">Alerte</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-muted">
                    {versQte(p.quantite_min)}&nbsp;{p.unite}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums">
                    {versDa(p.prix_vente)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/produits/${p.id}`)}>
                      Modifier
                    </Button>
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
