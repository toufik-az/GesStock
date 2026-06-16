import { useState, useRef, useCallback, useEffect } from 'react'
import { versDa } from '@/lib/format'
import type { Produit } from '@/types/db'

interface Props {
  produits:  Produit[]
  onSelect:  (p: Produit) => void   // matched from local list
  onScan:    (code: string) => void // raw code not matched (USB barcode scanner)
}

export function ProduitSearchInput({ produits, onSelect, onScan }: Props) {
  const [query,       setQuery]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter by name (contains) OR exact barcode prefix
  const suggestions = query.trim().length === 0
    ? []
    : produits
        .filter(p => {
          const q = query.toLowerCase()
          return (
            p.nom.toLowerCase().includes(q) ||
            (p.code_barre ?? '').toLowerCase().startsWith(q)
          )
        })
        .slice(0, 8)

  // Reset highlight when query changes
  useEffect(() => { setHighlighted(0) }, [query])

  const commit = useCallback((p: Produit) => {
    onSelect(p)
    setQuery('')
    setOpen(false)
    // Re-focus so the next scan / keystroke lands here immediately
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [onSelect])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(h => Math.max(h - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && suggestions.length > 0) {
        commit(suggestions[highlighted])
      } else {
        const code = query.trim()
        if (code) {
          onScan(code)
          setQuery('')
          setOpen(false)
        }
      }
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onKeyDown={handleKeyDown}
        onFocus={() => query.trim() && setOpen(true)}
        // onBlur: small delay so a mouseDown on a suggestion fires first
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Scanner code-barres ou rechercher un produit…"
        className="w-full rounded-xl border-2 border-primary/30 bg-white px-4 py-3 text-sm text-encre outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
        autoComplete="off"
        spellCheck={false}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
          {suggestions.map((p, i) => (
            <li
              key={p.id}
              // mouseDown fires before onBlur — prevents blur closing list before click registers
              onMouseDown={() => commit(p)}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                i === highlighted
                  ? 'bg-primary/10 text-primary'
                  : 'text-encre hover:bg-gray-50'
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{p.nom}</p>
                {p.code_barre && (
                  <p className="font-mono text-xs text-muted">{p.code_barre}</p>
                )}
              </div>
              <span className="ml-4 shrink-0 font-mono text-xs tabular-nums text-muted">
                {versDa(p.prix_vente)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
