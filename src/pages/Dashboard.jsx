import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Mic, LogOut, Plus, Loader2, Clock, FileText,
  Trash2, ChevronRight, Search, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function formatRelative(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return formatDate(iso)
}

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

// ─── empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onCreate, creating }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-20 text-center">
      <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Mic className="size-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Start your first session</h2>
        <p className="max-w-sm text-muted-foreground text-sm">
          Click the button below to begin a new recording. NoteFlow will
          transcribe your speech and generate smart notes automatically.
        </p>
      </div>
      <Button
        id="empty-new-session-btn"
        size="lg"
        onClick={onCreate}
        disabled={creating}
        className="gap-2"
      >
        {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        {creating ? 'Creating…' : 'New Recording Session'}
      </Button>
    </div>
  )
}

// ─── session card ─────────────────────────────────────────────────────────────

function SessionCard({ session, onDelete, deleting }) {
  const words = wordCount(session.full_transcript)

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm leading-snug truncate pr-2 group-hover:text-primary transition-colors">
          {session.title || 'Untitled Session'}
        </h3>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(session.id) }}
          disabled={deleting}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          aria-label="Delete session"
        >
          {deleting ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {formatDuration(session.duration_seconds)}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="size-3" />
          {words > 0 ? `${words.toLocaleString()} words` : 'No transcript'}
        </span>
        {session.note_count > 0 && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary font-medium">
            {session.note_count} {session.note_count === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {/* Date + open link */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          {formatRelative(session.created_at)}
        </span>
        <Link
          to={`/session/${session.id}`}
          className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
        >
          Open <ChevronRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')

  // ── Load sessions ──────────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // Get sessions + note counts in one query using a subquery via RPC or two queries
      const { data: sessionRows, error: sErr } = await supabase
        .from('sessions')
        .select('id, title, created_at, duration_seconds, full_transcript')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (sErr) throw sErr

      // Fetch note counts for each session
      const ids = (sessionRows || []).map((s) => s.id)
      let noteCounts = {}
      if (ids.length > 0) {
        const { data: noteRows } = await supabase
          .from('notes')
          .select('session_id')
          .in('session_id', ids)

        ;(noteRows || []).forEach(({ session_id }) => {
          noteCounts[session_id] = (noteCounts[session_id] || 0) + 1
        })
      }

      setSessions(
        (sessionRows || []).map((s) => ({ ...s, note_count: noteCounts[s.id] || 0 }))
      )
    } catch (err) {
      toast.error('Failed to load sessions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { loadSessions() }, [loadSessions])

  // ── Create session ─────────────────────────────────────────────────────────
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

  // ── Delete session ─────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Delete this session and all its notes?')) return
    setDeletingId(id)
    try {
      // Delete notes first, then the session
      // (frontend client is authenticated so RLS allows this)
      await supabase.from('notes').delete().eq('session_id', id)
      const { error } = await supabase.from('sessions').delete().eq('id', id)
      if (error) throw error
      setSessions((prev) => prev.filter((s) => s.id !== id))
      toast.success('Session deleted')
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Sign out ───────────────────────────────────────────────────────────────
  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/login', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Sign out failed')
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = sessions.filter((s) =>
    (s.title || '').toLowerCase().includes(search.toLowerCase())
  )

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-svh flex-col bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="size-4" />
          </div>
          <span className="text-lg font-semibold tracking-tight">NoteFlow</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.email}</span>
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">

        {/* Title + new session button */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Your Sessions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {loading ? 'Loading…' : `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          <Button
            id="new-session-btn"
            onClick={handleNewSession}
            disabled={creating}
            className="gap-2 shrink-0"
          >
            {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            <span className="hidden sm:inline">{creating ? 'Creating…' : 'New Session'}</span>
            <span className="sm:hidden">{creating ? '…' : 'New'}</span>
          </Button>
        </div>

        {/* Search bar */}
        {sessions.length > 3 && (
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="session-search"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl border bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && sessions.length === 0 && (
          <EmptyState onCreate={handleNewSession} creating={creating} />
        )}

        {/* No search results */}
        {!loading && sessions.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Search className="size-8 mx-auto mb-3 opacity-30" />
            <p>No sessions match "<strong>{search}</strong>"</p>
            <button
              onClick={() => setSearch('')}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Session grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDelete}
                deleting={deletingId === session.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
