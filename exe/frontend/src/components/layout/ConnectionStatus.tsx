import { useEffect, useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'

export function ConnectionStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const client = useQueryClient()
  const fetching = useIsFetching()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    const unsubscribe = client.getQueryCache().subscribe(() => {
      setFailed(client.getQueryCache().getAll().some(query => query.getObserversCount() > 0 && query.state.status === 'error'))
    })
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
      unsubscribe()
    }
  }, [client])
  if (online && !failed) return null
  return <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
    <span>{online ? 'Impossible de charger les données du magasin.' : 'Hors connexion. Les données affichées peuvent être anciennes. Reconnectez-vous avant de vendre.'}</span>
    <button disabled={!online || fetching > 0} onClick={() => void client.invalidateQueries()} className="font-semibold underline disabled:opacity-50">Réessayer</button>
  </div>
}
