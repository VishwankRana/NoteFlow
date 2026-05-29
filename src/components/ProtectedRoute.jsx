import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

/**
 * Wraps routes that require authentication.
 * - While the session is loading → show a centered spinner
 * - If not logged in → redirect to /login (preserving the intended path)
 * - If logged in → render children normally
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * Wraps public-only routes (login, signup).
 * If the user IS already logged in, redirect them to /dashboard.
 */
export function PublicRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
