import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import { Spinner } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-content-bg">
      <Spinner />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}
