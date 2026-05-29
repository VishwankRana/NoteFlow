import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

/**
 * Wraps the entire app and provides the current user session to all children.
 * Re-renders whenever Supabase fires an auth state change (login / logout / refresh).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    // Hydrate from the existing session on first mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session ?? null)
      setUser(data?.session?.user ?? null)
    })

    // Keep state in sync with Supabase auth events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Returns { user, session, loading } from the nearest AuthProvider. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
