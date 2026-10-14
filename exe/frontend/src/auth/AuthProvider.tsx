import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import type { Role } from '@/types/db'
import { useQueryClient } from '@tanstack/react-query'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const cachedUserId = useRef<string | null>(null)
  const [user,      setUser]      = useState<User | null>(null)
  const [session,   setSession]   = useState<Session | null>(null)
  const [storeName, setStoreName] = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      const nextId = sess?.user.id ?? null
      if (cachedUserId.current !== nextId) queryClient.clear()
      cachedUserId.current = nextId
      setSession(sess)
      setUser(sess?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  // Fetch store name whenever the user changes
  useEffect(() => {
    let cancelled = false
    setStoreName(null)
    if (!user) { setStoreName(null); return }
    const storeId = user.app_metadata?.store_id as string | undefined
    if (!storeId) return
    supabase
      .from('stores')
      .select('nom')
      .eq('id', storeId)
      .single()
      .then(({ data }) => { if (!cancelled) setStoreName(data?.nom ?? null) })
    return () => { cancelled = true }
  }, [user])

  const role    = (user?.app_metadata?.role    as Role)   ?? null
  const storeId = (user?.app_metadata?.store_id as string) ?? null

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, role, storeId, storeName, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
