import { useEffect, useRef } from 'react'

/**
 * Left panel — displays the live transcript.
 *
 * @param {{ finalSegments: string[], interimText: string }} props
 *   finalSegments — array of finalized speech chunks (displayed normally)
 *   interimText   — current in-progress recognition text (muted / italic)
 */
export function TranscriptPanel({ finalSegments, interimText }) {
  const bottomRef = useRef(null)

  // Auto-scroll whenever content changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [finalSegments, interimText])

  const fullText = finalSegments.join(' ').trim()
  const wordCount = fullText ? fullText.split(/\s+/).filter(Boolean).length : 0
  const isEmpty = finalSegments.length === 0 && !interimText

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable text area */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="size-6 text-muted-foreground"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-[200px]">
              Press <strong className="text-foreground">Start Recording</strong> and begin speaking
            </p>
          </div>
        ) : (
          <p className="text-sm leading-8 font-mono break-words">
            {finalSegments.map((seg, i) => (
              <span key={i} className="text-foreground">
                {seg}{' '}
              </span>
            ))}
            {interimText && (
              <span className="text-muted-foreground italic">{interimText}</span>
            )}
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer — word count */}
      <div className="shrink-0 border-t px-5 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/20">
        <span>Live Transcript</span>
        <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
      </div>
    </div>
  )
}
