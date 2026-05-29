import { Loader2 } from 'lucide-react'

/**
 * Animated status badge shown in the Session top bar.
 * @param {{ status: 'idle' | 'listening' | 'processing' }} props
 */
export function StatusBadge({ status }) {
  if (status === 'listening') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
        {/* Pulsing red dot */}
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive-foreground opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-destructive-foreground" />
        </span>
        Listening
      </span>
    )
  }

  if (status === 'processing') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Processing
      </span>
    )
  }

  // idle
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
      <span className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
      Idle
    </span>
  )
}
