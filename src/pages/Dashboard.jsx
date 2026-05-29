import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mic, LogOut, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Sign out failed')
    }
  }

  async function handleNewSession() {
    if (!user) return
    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: user.id, title: 'Untitled Session' })
        .select('id')
        .single()

      if (error) throw error
      navigate(`/session/${data.id}`)
    } catch (err) {
      toast.error(err.message || 'Could not create session')
      setCreating(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NoteFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to NoteFlow</CardTitle>
            <CardDescription>
              Signed in as <strong>{user?.email}</strong>
              <br />
              Session history is coming in Step 6.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              id="new-session-btn"
              size="lg"
              onClick={handleNewSession}
              disabled={creating}
              className="gap-2"
            >
              {creating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {creating ? 'Creating session…' : 'New Recording Session'}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will create a new session and open the recording page.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
