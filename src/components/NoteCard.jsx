import { Badge } from '@/components/ui/badge'

/**
 * A single AI-generated note card.
 *
 * @param {{ note: {topic, summary, keyPoints}, index: number }} props
 */
export function NoteCard({ note, index }) {
  return (
    <article className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* Colored top accent bar */}
      <div className="h-1 bg-gradient-to-r from-primary/60 to-primary/20" />

      <div className="px-4 pt-3 pb-4 space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight">{note.topic}</h3>
          <Badge variant="outline" className="text-xs shrink-0 tabular-nums">
            #{index + 1}
          </Badge>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed">{note.summary}</p>

        {/* Key points */}
        {note.keyPoints?.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {note.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-1.5 size-1.5 rounded-full bg-primary/70 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
