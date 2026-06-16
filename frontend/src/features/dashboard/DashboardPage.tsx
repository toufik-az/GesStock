import { useState, useMemo } from 'react'
import { useQuery }  from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { supabase }     from '@/lib/supabaseClient'
import { versDa, versDaCompact, versDateFr, debutJour, maintenant } from '@/lib/format'
import { PERIODES }     from '@/lib/constants'
import { StatCard }     from '@/components/ui/StatCard'
import { Card }         from '@/components/ui/Card'
import { Spinner }      from '@/components/ui/Spinner'
import { BarCA }        from '@/components/charts/BarCA'
import { DonutProduits } from '@/components/charts/DonutProduits'

type Periode = (typeof PERIODES)[number]

export function DashboardPage() {
  const navigate = useNavigate()
  const [periode, setPeriode] = useState<Periode>(PERIODES[0])

  // Memoize so the queryKey is stable within a period (maintenant() would change each render)
  const { debut, fin } = useMemo(() => ({
    debut: debutJour(periode.days),
    fin:   maintenant(),
  }), [periode])

  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['dashboard-kpis', debut, fin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dashboard_kpis', { p_debut: debut, p_fin: fin })
      if (error) throw error
      return data as { ca: number; nb_ventes: number; marge: number; alertes: number }
    },
  })

  const { data: topProduits = [] } = useQuery({
    queryKey: ['top-produits', debut, fin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('top_produits', { p_debut: debut, p_fin: fin })
      if (error) throw error
      return (data ?? []) as { nom: string; quantite_vendue: number; total: number }[]
    },
  })

  const { data: parCategorie = [] } = useQuery({
    queryKey: ['ventes-par-categorie', debut, fin],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('ventes_par_categorie', { p_debut: debut, p_fin: fin })
      if (error) throw error
      return (data ?? []) as { categorie: string; total: number }[]
    },
  })

  const { data: dernieres = [] } = useQuery({
    queryKey: ['dernieres-ventes'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('dernieres_ventes')
      if (error) throw error
      return (data ?? []) as { id: string; date_heure: string; total: number; nom_caissier: string }[]
    },
  })

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODES.map(p => (
          <button
            key={p.label}
            onClick={() => setPeriode(p)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              p.label === periode.label
                ? 'bg-primary text-white'
                : 'bg-white text-muted hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      {kpisLoading ? (
        <div className="flex justify-center py-8"><Spinner size="lg" /></div>
      ) : kpisError ? (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-cta">
          Erreur KPIs : {(kpisError as Error).message}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Chiffre d'affaires"
            value={versDaCompact(kpis?.ca ?? 0)}
            sub={periode.label}
          />
          <StatCard
            label="Nb. ventes"
            value={String(kpis?.nb_ventes ?? 0)}
            sub={periode.label}
          />
          <StatCard
            label="Marge bénéficiaire"
            value={versDaCompact(kpis?.marge ?? 0)}
            sub={periode.label}
            accent="default"
          />
          <StatCard
            label="Produits en alerte"
            value={String(kpis?.alertes ?? 0)}
            sub="cliquer pour voir"
            accent={kpis?.alertes ? 'danger' : 'default'}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-display text-sm font-semibold text-encre">
            CA par catégorie
          </h2>
          <BarCA data={parCategorie} />
        </Card>

        <Card>
          <h2 className="mb-4 font-display text-sm font-semibold text-encre">
            Top 5 produits
          </h2>
          <DonutProduits data={topProduits.map(p => ({ nom: p.nom, total: p.total }))} />
        </Card>
      </div>

      {/* Top products table */}
      {topProduits.length > 0 && (
        <Card>
          <h2 className="mb-4 font-display text-sm font-semibold text-encre">Meilleures ventes</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-muted border-b border-gray-100">
                <th className="pb-2 pr-4">#</th>
                <th className="pb-2">Produit</th>
                <th className="pb-2 text-right">Qté vendue</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {topProduits.map((p, i) => (
                <tr key={p.nom}>
                  <td className="py-2 pr-4 text-xs font-mono text-muted">{i + 1}</td>
                  <td className="py-2 text-sm text-encre">{p.nom}</td>
                  <td className="py-2 text-right font-mono text-sm tabular-nums text-muted">{p.quantite_vendue}</td>
                  <td className="py-2 text-right font-mono text-sm tabular-nums">{versDa(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Recent sales */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-sm font-semibold text-encre">Dernières ventes</h2>
          <button
            onClick={() => navigate('/historique')}
            className="text-xs text-primary hover:underline"
          >
            Voir tout →
          </button>
        </div>

        {dernieres.length === 0 ? (
          <p className="text-sm text-muted">Aucune vente enregistrée.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {dernieres.map(v => (
              <div
                key={v.id}
                className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded"
                onClick={() => navigate(`/recu/${v.id}`)}
              >
                <div>
                  <p className="text-sm text-encre">{v.nom_caissier}</p>
                  <p className="font-mono text-xs text-muted tabular-nums">{versDateFr(v.date_heure)}</p>
                </div>
                <span className="font-mono text-sm tabular-nums font-medium">{versDa(v.total)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Alerts shortcut */}
      {(kpis?.alertes ?? 0) > 0 && (
        <button
          onClick={() => navigate('/alertes')}
          className="flex w-full items-center gap-3 rounded-xl border border-cta/20 bg-cta-light p-4 text-left hover:bg-red-100 transition-colors"
        >
          <AlertTriangle className="h-5 w-5 text-cta shrink-0" />
          <div>
            <p className="text-sm font-medium text-cta">
              {kpis!.alertes} produit(s) en dessous du seuil d'alerte
            </p>
            <p className="text-xs text-cta/70">Cliquer pour voir les détails →</p>
          </div>
        </button>
      )}
    </div>
  )
}
