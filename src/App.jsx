import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute'

// Pages
import Login    from '@/pages/Login'
import Signup   from '@/pages/Signup'
import Dashboard from '@/pages/Dashboard'
import Session  from '@/pages/Session'

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="noteflow-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public only ── */}
            <Route
              path="/login"
              element={<PublicRoute><Login /></PublicRoute>}
            />
            <Route
              path="/signup"
              element={<PublicRoute><Signup /></PublicRoute>}
            />

            {/* ── Protected ── */}
            <Route
              path="/dashboard"
              element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/session/:id"
              element={<ProtectedRoute><Session /></ProtectedRoute>}
            />

            {/* ── Catch-all ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
