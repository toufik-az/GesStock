import { useState } from 'react'
import { supabase }  from '@/lib/supabaseClient'
import { versDa }    from '@/lib/format'
import { Modal }     from '@/components/ui/Modal'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import type { CartLine } from './CaissePage'

interface Props {
  open:      boolean
  total:     number
  cart:      CartLine[]
  onClose:   () => void
  onSuccess: (venteId: string) => void
}

export function PayDialog({ open, total, cart, onClose, onSuccess }: Props) {
  const [montant,  setMontant]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const montantNum = parseFloat(montant.replace(',', '.')) || 0
  const monnaie    = montantNum - total

  const handlePay = async () => {
    if (montantNum < total) { setError('Montant insuffisant'); return }
    setError('')
    setLoading(true)
    try {
      const lignes = cart.map(l => ({
        produit_id:    l.produit.id,
        nom_produit:   l.produit.nom,
        quantite:      l.quantite,
        prix_unitaire: l.produit.prix_vente,
        prix_achat:    l.produit.prix_achat,
      }))

      const { data, error: rpcError } = await supabase.rpc('enregistrer_vente', {
        p_lignes:       lignes,
        p_montant_recu: montantNum,
      })

      if (rpcError) throw rpcError
      setMontant('')
      onSuccess(data as string)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Encaisser" maxWidth="max-w-sm">
      <div className="space-y-4">
        <div className="rounded-xl bg-content-bg p-4 text-center">
          <p className="text-xs text-muted uppercase tracking-wide">À encaisser</p>
          <p className="font-mono text-3xl font-semibold tabular-nums text-encre mt-1">
            {versDa(total)}
          </p>
        </div>

        <Input
          label="Montant reçu (DA)"
          type="number"
          min={0}
          step="any"
          value={montant}
          onChange={e => { setMontant(e.target.value); setError('') }}
          onKeyDown={e => { if (e.key === 'Enter') handlePay() }}
          autoFocus
          error={error}
        />

        {montantNum > 0 && (
          <div className={`rounded-xl p-3 text-center ${monnaie >= 0 ? 'bg-green-50' : 'bg-cta-light'}`}>
            <p className="text-xs text-muted">Monnaie à rendre</p>
            <p className={`font-mono text-xl font-semibold tabular-nums mt-0.5 ${monnaie >= 0 ? 'text-success' : 'text-cta'}`}>
              {monnaie >= 0 ? versDa(monnaie) : '—'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Annuler</Button>
          <Button variant="cta" className="flex-1" loading={loading} onClick={handlePay}>
            Confirmer
          </Button>
        </div>
      </div>
    </Modal>
  )
}
