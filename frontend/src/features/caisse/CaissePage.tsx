import { useState, useCallback } from 'react'
import { useNavigate }           from 'react-router-dom'
import { useQuery }              from '@tanstack/react-query'
import { ShoppingCart, Trash2 } from 'lucide-react'
import { supabase }     from '@/lib/supabaseClient'
import { versDa, versQte } from '@/lib/format'
import { useAuth }      from '@/auth/useAuth'
import { Button }       from '@/components/ui/Button'
import { ProduitSearchInput } from '@/components/ProduitSearchInput'
import { PayDialog }    from './PayDialog'
import { QuickCreateDialog } from './QuickCreateDialog'
import { EmptyState }   from '@/components/ui/EmptyState'
import type { Produit } from '@/types/db'

export interface CartLine { produit: Produit; quantite: number }

export function CaissePage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const [cart,      setCart]      = useState<CartLine[]>([])
  const [payOpen,   setPayOpen]   = useState(false)
  const [quickCode, setQuickCode] = useState<string | null>(null)
  const [toast,     setToast]     = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Keep produits cache for stock look-up
  const { data: allProduits = [] } = useQuery({
    queryKey: ['produits', ''],
    queryFn: async () => {
      const { data, error } = await supabase.from('produits').select('*').order('nom')
      if (error) throw error
      return data as Produit[]
    },
    staleTime: 1000 * 15,
  })

  const handleScan = useCallback(async (code: string) => {
    // Try exact barcode match first, then name search
    let produit: Produit | undefined = allProduits.find(
      p => p.code_barre === code
    )
    if (!produit) {
      // Fallback: live DB look-up (covers freshly added items)
      const { data } = await supabase
        .from('produits')
        .select('*')
        .eq('code_barre', code)
        .single()
      produit = data ?? undefined
    }

    if (!produit) {
      if (role === 'gerant') {
        navigate(`/produits/nouveau?code=${encodeURIComponent(code)}`)
      } else {
        setQuickCode(code)
      }
      return
    }

    addToCart(produit)
  }, [allProduits, role, navigate])

  const addToCart = (produit: Produit) => {
    setCart(prev => {
      const existing = prev.find(l => l.produit.id === produit.id)
      if (existing) {
        if (existing.quantite + 1 > produit.quantite) {
          showToast(`Stock insuffisant pour ${produit.nom}`)
          return prev
        }
        return prev.map(l => l.produit.id === produit.id
          ? { ...l, quantite: l.quantite + 1 }
          : l)
      }
      if (produit.quantite < 1) {
        showToast(`Stock insuffisant pour ${produit.nom}`)
        return prev
      }
      return [...prev, { produit, quantite: 1 }]
    })
  }

  const changeQte = (produitId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(l => {
          if (l.produit.id !== produitId) return l
          const next = l.quantite + delta
          if (next <= 0) return null
          if (delta > 0 && next > l.produit.quantite) {
            showToast(`Stock insuffisant pour ${l.produit.nom}`)
            return l
          }
          return { ...l, quantite: next }
        })
        .filter(Boolean) as CartLine[]
    )
  }

  const setQteDirecte = (produitId: string, val: number) => {
    if (isNaN(val) || val < 1) return
    setCart(prev =>
      prev.map(l => {
        if (l.produit.id !== produitId) return l
        if (val > l.produit.quantite) {
          showToast(`Stock insuffisant pour ${l.produit.nom}`)
          return { ...l, quantite: l.produit.quantite }
        }
        return { ...l, quantite: val }
      })
    )
  }

  const removeFromCart = (produitId: string) =>
    setCart(prev => prev.filter(l => l.produit.id !== produitId))

  const total = cart.reduce((s, l) => s + l.quantite * l.produit.prix_vente, 0)

  return (
    <div className="flex h-full flex-col gap-4 lg:flex-row">
      {/* ── Left: product entry ─────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4">
        <ProduitSearchInput
          produits={allProduits}
          onSelect={addToCart}
          onScan={handleScan}
        />

        {cart.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-12 w-12" />}
            message="Scannez ou saisissez un code-barres pour commencer."
          />
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {cart.map(({ produit, quantite }) => (
              <div
                key={produit.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-card"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-encre">{produit.nom}</p>
                  <p className="font-mono text-xs tabular-nums text-muted">
                    {versQte(quantite)} × {versDa(produit.prix_vente)}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeQte(produit.id, -1)}
                    className="rounded-lg border border-gray-200 p-1 text-muted hover:bg-gray-50"
                  >
                    <span className="block h-3 w-3 text-center leading-none font-bold">−</span>
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={produit.quantite}
                    value={quantite}
                    onChange={e => setQteDirecte(produit.id, parseInt(e.target.value, 10))}
                    className="w-14 rounded border border-gray-200 bg-white text-center font-mono text-sm tabular-nums outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => changeQte(produit.id, 1)}
                    className="rounded-lg border border-gray-200 p-1 text-muted hover:bg-gray-50"
                  >
                    <span className="block h-3 w-3 text-center leading-none font-bold">+</span>
                  </button>
                </div>

                <span className="w-24 text-right font-mono text-sm tabular-nums text-encre">
                  {versDa(quantite * produit.prix_vente)}
                </span>

                <button
                  onClick={() => removeFromCart(produit.id)}
                  className="text-muted hover:text-cta transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right: till display ──────────────────────────────────────────── */}
      <div
        className="flex w-full flex-col justify-between rounded-2xl p-6 lg:w-72"
        style={{ background: '#1A1A2E' }}
      >
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-white/40">
            Total
          </p>
          <p className="mt-2 font-mono text-4xl font-semibold tabular-nums text-white">
            {versDa(total)}
          </p>
          <p className="mt-1 font-mono text-sm tabular-nums text-white/50">
            {cart.length} article{cart.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button
          variant="cta"
          size="lg"
          disabled={cart.length === 0}
          onClick={() => setPayOpen(true)}
          className="mt-6 w-full justify-center text-base font-semibold"
        >
          Encaisser
        </Button>
      </div>

      {/* Dialogs */}
      <PayDialog
        open={payOpen}
        total={total}
        cart={cart}
        onClose={() => setPayOpen(false)}
        onSuccess={venteId => {
          setCart([])
          setPayOpen(false)
          navigate(`/recu/${venteId}`)
        }}
      />

      <QuickCreateDialog
        open={Boolean(quickCode)}
        code={quickCode ?? ''}
        onClose={() => setQuickCode(null)}
        onCreated={produit => {
          setQuickCode(null)
          addToCart(produit)
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-encre px-5 py-3 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
