import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ConnectionStatus } from './ConnectionStatus'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menu = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (menuOpen) menu.current?.showModal()
    else menu.current?.close()
  }, [menuOpen])
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <dialog aria-label="Navigation du magasin" ref={menu} onCancel={() => setMenuOpen(false)} onClick={e => { if (e.target === e.currentTarget) setMenuOpen(false) }} className="m-0 h-[100dvh] max-h-none w-72 max-w-[85vw] bg-sidebar p-0 text-white backdrop:bg-black/50">
        <button autoFocus aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} className="absolute right-2 top-2 rounded-lg p-3"><X className="h-5 w-5" /></button>
        <Sidebar mobile onNavigate={() => setMenuOpen(false)} />
      </dialog>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <ConnectionStatus />
        <main className="flex-1 overflow-auto bg-content-bg p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
