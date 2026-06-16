export const UNITES = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton'] as const
export type Unite = (typeof UNITES)[number]

export const ROLES = { GERANT: 'gerant', CAISSIER: 'caissier' } as const

export const PALETTE_CATEGORIES = [
  '#1565C0', '#E65100', '#00695C', '#F9A825', '#6D4C41',
  '#AD1457', '#0277BD', '#6A1B9A', '#2E7D32', '#C62828',
] as const

export const PERIODES = [
  { label: "Aujourd'hui", days: 0 },
  { label: '7 jours',     days: 6  },
  { label: '30 jours',    days: 29 },
] as const

export const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001'
