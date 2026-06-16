import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, Package, Tag,
  AlertTriangle, Truck, History, Settings,
} from 'lucide-react'
import { useAuth } from '@/auth/useAuth'
import { clsx } from 'clsx'

const GERANT_LINKS = [
  { to: '/dashboard',  label: 'Accueil',    Icon: LayoutDashboard },
  { to: '/caisse',     label: 'Caisse',     Icon: ShoppingCart },
  { to: '/produits',   label: 'Produits',   Icon: Package },
  { to: '/categories', label: 'Catégories', Icon: Tag },
  { to: '/alertes',    label: 'Alertes',    Icon: AlertTriangle },
  { to: '/reception',  label: 'Réception',  Icon: Truck },
  { to: '/historique', label: 'Ventes',     Icon: History },
  { to: '/parametres', label: 'Réglages',   Icon: Settings },
]

const CAISSIER_LINKS = [
  { to: '/caisse',     label: 'Caisse',  Icon: ShoppingCart },
  { to: '/historique', label: 'Ventes',  Icon: History },
]

export function Sidebar() {
  const { role, storeName } = useAuth()
  const links = role === 'gerant' ? GERANT_LINKS : CAISSIER_LINKS

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-sidebar print:hidden">
      {/* Logo / store name */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <img
          src="/logo.png"
          alt="GesStock"
          className="h-9 w-9 rounded-lg object-cover shrink-0"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold leading-tight text-white truncate">
            {storeName ?? 'GesStock'}
          </p>
          <p className="text-[10px] text-white/50 uppercase tracking-wider">
            {role === 'gerant' ? 'Gérant' : 'Caissier'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 text-[10px] text-white/25 text-center">
        GesStock v1.0
      </div>
    </aside>
  )
}
