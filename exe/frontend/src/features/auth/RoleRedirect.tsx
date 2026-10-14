import { Navigate } from 'react-router-dom'
import { useAuth }   from '@/auth/useAuth'

export function RoleRedirect() {
  const { role } = useAuth()
  if (role === 'gerant')   return <Navigate to="/dashboard" replace />
  if (role === 'caissier') return <Navigate to="/caisse"    replace />
  return <Navigate to="/login" replace />
}
