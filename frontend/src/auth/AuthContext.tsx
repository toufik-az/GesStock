import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { Role } from '@/types/db'

export interface AuthState {
  user: User | null
  session: Session | null
  role: Role | null
  storeId: string | null
  storeName: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)
