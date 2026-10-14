import { useState } from 'react'
import { useQuery }  from '@tanstack/react-query'
import { Minus, Plus, Trash2, CheckCircle } from 'lucide-react'
import { supabase }     from '@/lib/supabaseClient'
import { versQte }      from '@/lib/format'
import { BarcodeInput } from '@/components/BarcodeInput'
import { Button }       from '@/components/ui/Button'
import { Select }       from '@/components/ui/Select'
import { Modal }        from '@/components/ui/Modal'
import { EmptyState }   from '@/components/ui/EmptyState'
import type { Produit, Fournisseur } from '@/types/db'

interface ReceptionLine { produit: Produit; quantite: number }

export function ReceptionPage() {
  const [lignes,       setLignes]       = useState<ReceptionLine[]>([])
  const [fournisseurId, setFournisseurId] = useState('')
  const [confirm,      setConfirm]      = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [success,      setSuccess]      = useState(false)
  const [error,        setError]        = useState('')

  const { data: fournisseurs = [] } = useQuery({
    queryKey: ['fournisseurs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fournisseurs').select('*').order('nom')
      if (error) throw error
      return data as Fournisseur[]
    },
  })

  const { data: allProduits = [] } = useQuery({
    queryKey: ['produits', ''],
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').order('nom')
      if (error) throw error
      return data as Produit[]
    },
  })

  const addByCode = async (code: string) => {
    let produit: Produit | undefined = allProduits.find(p => p.code_barre === code || p.nom.toLowerCase().includes(code.toLowerCase()))
    if (!produit) {
      const { data } = await supabase.from('produits').select('*').eq('code_barre', code).single()
      produit = data ?? undefined
    }
    if (!produit) { setError(`Produit introuvable : ${code}`); return }
    addProduit(produit)
  }

  const addProduit = (produit: Produit) => {
    setLignes(prev => {
      const ex = prev.find(l => l.produit.id === produit.id)
      if (ex) return prev.map(l => l.produit.id === produit.id ? { ...l, quantite: l.quantite + 1 } : l)
      return [...prev, { produit, quantite: 1 }]
    })
    setError('')
  }

  const changeQte = (id: string, delta: number) => {
    setLignes(prev =>
      prev
        .map(l => l.produit.id === id ? { ...l, quantite: Math.max(0, l.quantite + delta) } : l)
        .filter(l => l.quantite > 0)
    )
  }

  const handleValider = async () => {
    setLoading(true)
    setError('')
    try {
      const { error: rpcError } = await supabase.rpc('enregistrer_reception', {
        p_fournisseur_id: fournisseurId || null,
        p_lignes: lignes.map(l => ({
          produit_id: l.produit.id,
          quantite:   l.quantite,
          prix_achat: l.produit.prix_achat,
        })),
      })
      if (rpcError) throw rpcError
      setLignes([])
      setFournisseurId('')
      setConfirm(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réception')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-success">
          <CheckCircle className="h-4 w-4" />
          Réception enregistrée, stock mis à jour.
        </div>
      )}

      {/* Fournisseur */}
      <Select
        label="Fournisseur"
        value={fournisseurId}
        onChange={e => setFournisseurId(e.target.value)}
      >
        <option value="">Sans fournisseur</option>
        {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
      </Select>

      {/* Barcode entry */}
      <BarcodeInput onScan={addByCode} placeholder="Scanner ou saisir un code-barres / nom…" autoFocus={false} />

      {/* OR choose from list */}
      <div>
        <p className="text-xs text-muted mb-1">Ou choisir un produit :</p>
        <select
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          value=""
          onChange={e => {
            const p = allProduits.find(p => p.id === e.target.value)
            if (p) addProduit(p)
          }}
        >
          <option value="">— Sélectionner —</option>
          {allProduits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
        </select>
      </div>

      {error && <p className="text-xs text-cta">{error}</p>}

      {/* Lines */}
      {lignes.length === 0 ? (
        <EmptyState message="Scannez ou choisissez les produits reçus" />
      ) : (
        <div className="space-y-2">
          {lignes.map(({ produit, quantite }) => (
            <div key={produit.id} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-card">
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-encre">{produit.nom}</p>
                <p className="text-xs text-muted">Stock actuel : {versQte(produit.quantite)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQte(produit.id, -1)} className="rounded-lg border border-gray-200 p-1 text-muted hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                <span className="w-10 text-center font-mono text-sm tabular-nums">+{versQte(quantite)}</span>
                <button onClick={() => changeQte(produit.id, 1)}  className="rounded-lg border border-gray-200 p-1 text-muted hover:bg-gray-50"><Plus  className="h-3 w-3" /></button>
              </div>
              <button onClick={() => setLignes(prev => prev.filter(l => l.produit.id !== produit.id))} className="text-muted hover:text-cta">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {lignes.length > 0 && (
        <Button size="lg" className="w-full justify-center" onClick={() => setConfirm(true)}>
          Valider la réception ({lignes.length} produit{lignes.length !== 1 ? 's' : ''})
        </Button>
      )}

      <Modal open={confirm} onClose={() => setConfirm(false)} title="Confirmer la réception">
        <p className="text-sm text-muted">
          Confirmer la réception de <strong>{lignes.length}</strong> produit(s) ?
          Le stock sera mis à jour immédiatement.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirm(false)}>Annuler</Button>
          <Button loading={loading} onClick={handleValider}>Confirmer</Button>
        </div>
      </Modal>
    </div>
  )
}
