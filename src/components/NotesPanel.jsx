import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NoteCard } from '@/components/NoteCard'

/**
 * Right panel — displays AI-generated notes, newest on top.
 *
 * @param {{
 *   notes: Array<{id, topic, summary, keyPoints}>,
 *   onGenerateNow: () => void,
 *   isProcessing: boolean,
 *   pendingWordCount: number,
 * }} props
 */
export function NotesPanel({ notes = [], onGenerateNow, isProcessing, pendingWordCount }) {
  const canGenerate = pendingWordCount >= 40 && !isProcessing

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Panel header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b bg-muted/20">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Smart Notes
        </h2>
        <Button
          id="generate-notes-btn"
          size="sm"
          variant="outline"
          onClick={onGenerateNow}
          disabled={!canGenerate}
          className="h-7 gap-1.5 text-xs"
          title={
            isProcessing
              ? 'Generating…'
              : pendingWordCount < 40
              ? `Need ${40 - pendingWordCount} more words`
              : 'Generate notes now'
          }
        >
          {isProcessing ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          {isProcessing ? 'Generating…' : 'Generate Now'}
        </Button>
      </div>

      {/* Notes list — newest first */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 select-none text-center">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="size-5 text-muted-foreground opacity-40" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground/60">
                Notes are generated automatically every 60 s (40+ words), or click{' '}
                <strong className="text-muted-foreground">Generate Now</strong>.
              </p>
            </div>
          </div>
        ) : (
          [...notes].reverse().map((note, i) => (
            <NoteCard key={note.id ?? i} note={note} index={notes.length - 1 - i} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
        <span>
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </span>
        <span className="tabular-nums">{pendingWordCount} words pending</span>
      </div>
    </div>
  )
}
