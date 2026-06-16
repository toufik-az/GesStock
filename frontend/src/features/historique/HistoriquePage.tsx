import { useQuery }  from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { History }   from 'lucide-react'
import { supabase }  from '@/lib/supabaseClient'
import { versDa, versDateFr } from '@/lib/format'
import { useAuth }   from '@/auth/useAuth'
import { Card }      from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner }   from '@/components/ui/Spinner'
import type { Vente, Profile } from '@/types/db'

interface VenteRow extends Vente { nomCaissier: string }

export function HistoriquePage() {
  const navigate     = useNavigate()
  const { user, role } = useAuth()

  const { data: ventes = [], isLoading } = useQuery({
    queryKey: ['historique', role, user?.id],
    queryFn: async () => {
      let q = supabase
        .from('ventes')
        .select('*, profiles(nom)')
        .order('date_heure', { ascending: false })

      if (role === 'caissier') {
        q = q.eq('caissier_id', user!.id)
      }

      const { data, error } = await q
      if (error) throw error

      return (data ?? []).map((v: Vente & { profiles: Pick<Profile, 'nom'> | null }) => ({
        ...v,
        nomCaissier: v.profiles?.nom ?? '',
      })) as VenteRow[]
    },
  })

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : ventes.length === 0 ? (
        <EmptyState
          icon={<History className="h-12 w-12" />}
          message="Aucune vente enregistrée pour le moment."
        />
      ) : (
        <Card padding={false}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-muted">
                <th className="px-4 py-3">Date / Heure</th>
                {role === 'gerant' && <th className="px-4 py-3">Caissier</th>}
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Monnaie</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ventes.map(v => (
                <tr
                  key={v.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/recu/${v.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs tabular-nums text-muted">
                    {versDateFr(v.date_heure)}
                  </td>
                  {role === 'gerant' && (
                    <td className="px-4 py-3 text-sm text-encre">{v.nomCaissier}</td>
                  )}
                  <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-encre font-medium">
                    {versDa(v.total)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-muted">
                    {versDa(v.monnaie_rendue)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-primary hover:underline">
                    Reçu →
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
