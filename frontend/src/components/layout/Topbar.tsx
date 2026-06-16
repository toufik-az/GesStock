import { useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
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

export function Topbar() {
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()

  const title =
    TITLES[pathname] ||
    (pathname.startsWith('/produits/') ? 'Modifier le produit' : '') ||
    (pathname.startsWith('/recu/')     ? 'Reçu de vente'       : 'GesStock')

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-6 print:hidden">
      <h1 className="font-display text-base font-semibold text-encre">{title}</h1>

      <div className="flex items-center gap-3">
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
