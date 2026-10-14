import { useLocation } from 'react-router-dom'
import { LogOut, Menu, RefreshCw } from 'lucide-react'
import { useQueryClient, useIsFetching } from '@tanstack/react-query'
import { useAuth } from '@/auth/useAuth'

const TITLES: Record<string, string> = {
  '/dashboard':        'Tableau de bord',
  '/caisse':           'Caisse',
  '/produits':         'Produits',
  '/produits/nouveau': 'Nouveau produit',
  '/categories':       'Catégories',
  '/alertes':          'Alertes stock',
  '/reception':        'Réception marchandise',
  '/historique':       'Historique des ventes',
  '/parametres':       'Paramètres',
  '/parametres/staff': 'Personnel',
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const queryClient = useQueryClient()
  const fetching = useIsFetching()
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/produits/') ? 'Modifier le produit' : '') ||
    (pathname.startsWith('/recu/')     ? 'Reçu de vente'       : 'GesStock')

  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 md:px-6 print:hidden">
      <button aria-label="Ouvrir le menu" onClick={onOpenMenu} className="rounded-lg p-3 md:hidden"><Menu className="h-5 w-5" /></button>
      <h1 className="font-display text-base font-semibold text-encre">{title}</h1>

      <div className="flex items-center gap-3">
        <button aria-label="Actualiser les données" title="Actualiser les données" disabled={fetching > 0} onClick={() => void queryClient.invalidateQueries()} className="rounded-lg p-3 text-muted hover:bg-gray-50 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} /></button>
        <span className="text-sm text-muted hidden sm:block">
          {user?.email}
        </span>
        <button
          onClick={signOut}
          title="Déconnexion"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-gray-50 hover:text-encre transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  )
}
