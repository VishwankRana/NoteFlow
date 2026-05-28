import { useState } from 'react'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function SupabaseStatus() {
  const [status, setStatus] = useState('idle') // idle | loading | ok | error
  const [message, setMessage] = useState('')

  async function testConnection() {
    if (!isSupabaseConfigured || !supabase) {
      setStatus('error')
      setMessage('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
      return
    }

    setStatus('loading')
    setMessage('')

    try {
      const { error: authError } = await supabase.auth.getSession()
      if (authError) throw authError

      const { error: tableError } = await supabase.from('sessions').select('id').limit(1)
      if (tableError) {
        if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
          throw new Error('Table "sessions" not found. Run supabase/migrations/001_initial_schema.sql')
        }
        throw tableError
      }

      setStatus('ok')
      setMessage('Connected. Tables exist and RLS is active (empty result without login is expected).')
    } catch (err) {
      setStatus('error')
      setMessage(err.message || 'Connection failed')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Supabase env:</span>
        <Badge variant={isSupabaseConfigured ? 'default' : 'destructive'}>
          {isSupabaseConfigured ? 'configured' : 'missing'}
        </Badge>
      </div>

      <Button variant="outline" onClick={testConnection} disabled={status === 'loading'}>
        {status === 'loading' && <Loader2 className="animate-spin" />}
        Test Supabase connection
      </Button>

      {status === 'ok' && (
        <p className="flex items-start gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      )}

      {status === 'error' && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <XCircle className="mt-0.5 size-4 shrink-0" />
          {message}
        </p>
      )}
    </div>
  )
}
