import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'
import type { Role } from '@/types/db'

interface Props { allow: Role[] }

export function RoleRoute({ allow }: Props) {
  const { role, loading } = useAuth()
  if (loading) return null
  if (!role || !allow.includes(role)) return <Navigate to="/caisse" replace />
  return <Outlet />
}
