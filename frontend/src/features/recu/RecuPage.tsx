import { useQuery }    from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ShoppingCart } from 'lucide-react'
import { supabase }   from '@/lib/supabaseClient'
import { versDa, versQte, versDateFr } from '@/lib/format'
import { useAuth }    from '@/auth/useAuth'
import { Button }     from '@/components/ui/Button'
import { Spinner }    from '@/components/ui/Spinner'
import type { Vente, LigneVente } from '@/types/db'

export function RecuPage() {
  const { venteId } = useParams<{ venteId: string }>()
  const navigate    = useNavigate()
  const { storeName } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['recu', venteId],
    queryFn: async () => {
      const [venteRes, lignesRes] = await Promise.all([
        supabase.from('ventes').select('*').eq('id', venteId!).single(),
        supabase.from('lignes_vente').select('*').eq('vente_id', venteId!).order('nom_produit'),
      ])
      if (venteRes.error) throw venteRes.error

      const vente  = venteRes.data as Vente
      const lignes = (lignesRes.data ?? []) as LigneVente[]

      // Fetch caissier name
      const { data: profile } = await supabase
        .from('profiles')
        .select('nom')
        .eq('id', vente.caissier_id)
        .single()

      return { vente, lignes, nomCaissier: profile?.nom ?? '' }
    },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  if (!data) return <p className="text-sm text-muted">Reçu introuvable.</p>

  const { vente, lignes, nomCaissier } = data

  return (
    <div className="mx-auto max-w-sm space-y-4">
      {/* Action buttons — hidden on print */}
      <div className="flex gap-3 print:hidden">
        <Button variant="ghost" onClick={() => navigate('/caisse')}>
          <ShoppingCart className="h-4 w-4" /> Nouvelle vente
        </Button>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Imprimer
        </Button>
      </div>

      {/* Receipt — visible on screen + in print root */}
      <div
        id="receipt-print-root"
        className="rounded-xl bg-white p-5 shadow-card font-mono text-xs text-encre print:rounded-none print:shadow-none print:p-0"
      >
        {/* Header */}
        <div className="text-center border-b border-dashed border-gray-300 pb-3 mb-3">
          <p className="font-display text-base font-bold text-encre print:font-mono">
            {storeName ?? 'GesStock'}
          </p>
          <p className="text-muted mt-0.5">{versDateFr(vente.date_heure)}</p>
          {nomCaissier && <p className="text-muted">Caissier : {nomCaissier}</p>}
        </div>

        {/* Lines */}
        <div className="space-y-1.5 mb-3">
          {lignes.map(l => (
            <div key={l.id} className="flex justify-between gap-2">
              <span className="flex-1">{l.nom_produit}</span>
              <span className="shrink-0 tabular-nums">
                {versQte(l.quantite)} × {versDa(l.prix_unitaire)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
          <div className="flex justify-between font-semibold">
            <span>TOTAL</span>
            <span className="tabular-nums">{versDa(vente.total)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Reçu</span>
            <span className="tabular-nums">{versDa(vente.montant_recu)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Monnaie</span>
            <span className="tabular-nums">{versDa(vente.monnaie_rendue)}</span>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-4 text-center text-muted border-t border-dashed border-gray-300 pt-3">
          Merci de votre visite !
        </p>
      </div>
    </div>
  )
}
