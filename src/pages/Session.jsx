import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Mic, MicOff, Download, Pencil, ArrowLeft, X, Check, AlertTriangle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
import { ThemeToggle } from '@/components/ThemeToggle'
import { StatusBadge } from '@/components/StatusBadge'
import { TranscriptPanel } from '@/components/TranscriptPanel'
import { NotesPanel } from '@/components/NotesPanel'
import { supabase } from '@/lib/supabase'
import { createSpeechRecognition, SUPPORTED_LANGUAGES, detectBrave } from '@/lib/speechRecognition'
import { toast } from 'sonner'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`
}

function countWords(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Session() {
  const { id } = useParams()
  const navigate = useNavigate()

  // ── Session meta ───────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(true)
  const [sessionTitle, setSessionTitle] = useState('Untitled Session')
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editDraft, setEditDraft] = useState('')
  const titleInputRef = useRef(null)

  // ── Browser capability detection ───────────────────────────────────────────
  const [isBrave, setIsBrave] = useState(false)
  const [speechIssue, setSpeechIssue] = useState(null)   // null | 'network' | 'not-supported'
  const [bannerDismissed, setBannerDismissed] = useState(false)

  useEffect(() => {
    detectBrave().then((brave) => setIsBrave(brave))
  }, [])

  // ── Recording state ────────────────────────────────────────────────────────
  const [status, setStatus] = useState('idle')      // 'idle' | 'listening' | 'processing'
  const [isListening, setIsListening] = useState(false)
  const [lang, setLang] = useState('en-US')
  const [durationSeconds, setDurationSeconds] = useState(0)

  // ── Transcript ─────────────────────────────────────────────────────────────
  const [finalSegments, setFinalSegments] = useState([])  // string[]
  const [interimText, setInterimText] = useState('')

  // ── Pending buffer (for note generation) ──────────────────────────────────
  const [pendingBuffer, setPendingBuffer] = useState([])  // string[]

  // ── Notes (populated in Step 8) ───────────────────────────────────────────
  const [notes, setNotes] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)

  // ── Refs (stable across renders, safe inside callbacks) ───────────────────
  const recognitionRef    = useRef(null)
  const isListeningRef    = useRef(false)
  const finalSegmentsRef  = useRef([])
  const pendingBufferRef  = useRef([])
  const durationTimerRef  = useRef(null)
  const autoSaveTimerRef  = useRef(null)
  const noteIntervalRef   = useRef(null)
  const langRef           = useRef(lang)
  const retryCountRef     = useRef(0)

  // Keep refs in sync with state
  isListeningRef.current   = isListening
  finalSegmentsRef.current  = finalSegments
  pendingBufferRef.current  = pendingBuffer
  langRef.current           = lang

  // ── Load session ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        toast.error('Session not found')
        navigate('/dashboard', { replace: true })
        return
      }

      setSessionTitle(data.title ?? 'Untitled Session')
      setDurationSeconds(data.duration_seconds ?? 0)

      if (data.full_transcript) {
        const restored = [data.full_transcript]
        setFinalSegments(restored)
        finalSegmentsRef.current = restored
      }

      setIsLoading(false)
    }

    load()
  }, [id, navigate])

  // ── Focus title input when entering edit mode ──────────────────────────────
  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    }
  }, [isEditingTitle])

  // ── Save transcript to Supabase ────────────────────────────────────────────
  const saveTranscript = useCallback(async (showToast = false) => {
    const segs = finalSegmentsRef.current
    if (!segs.length) return
    const fullText = segs.join(' ')
    const { error } = await supabase
      .from('sessions')
      .update({
        full_transcript: fullText,
        duration_seconds: durationSeconds,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (!error && showToast) toast.success('Transcript saved')
  }, [id, durationSeconds])

  // ── Note generation (AI wired up in Step 8) ───────────────────────────────
  const handleGenerateNotes = useCallback(async () => {
    const buffer = pendingBufferRef.current
    const text = buffer.join(' ')
    if (countWords(text) < 40) {
      toast.info('Need at least 40 words to generate notes.')
      return
    }

    setIsProcessing(true)
    setStatus('processing')

    try {
      // ── Placeholder (replaced in Step 8) ──
      await new Promise((r) => setTimeout(r, 800)) // simulate latency
      toast.info('AI note generation will be wired up in Step 8.')
      setPendingBuffer([])
    } catch (err) {
      toast.error(err.message || 'Note generation failed')
    } finally {
      setIsProcessing(false)
      setStatus(isListeningRef.current ? 'listening' : 'idle')
    }
  }, [])

  // ── Launch a fresh recognition instance ───────────────────────────────────
  // IMPORTANT: SpeechRecognition objects are single-use. After onEnd fires
  // you MUST create a new instance — calling .start() on a dead object throws.
  function launchRecognition() {
    const recognition = createSpeechRecognition({
      lang: langRef.current,

      onInterim: (text) => setInterimText(text),

      onFinal: (text) => {
        retryCountRef.current = 0          // reset on successful result
        const trimmed = text.trim()
        if (!trimmed) return
        setFinalSegments((prev) => [...prev, trimmed])
        setInterimText('')
        setPendingBuffer((prev) => [...prev, trimmed])
      },

      onError: (event) => {
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Allow microphone access and try again.')
          stopListening()
        }
        // All other errors (network, aborted, no-speech) are handled in onEnd
      },

      // lastErrorCode is passed from speechRecognition.js — tells us WHY it ended
      onEnd: (lastErrorCode) => {
        if (!isListeningRef.current) return

        const isRealFailure = lastErrorCode === 'network' || lastErrorCode === 'audio-capture'

        if (isRealFailure) {
          retryCountRef.current += 1
        }
        // no-speech, aborted, normal continuous-mode restart → don't penalize

        if (retryCountRef.current > 5) {
          setSpeechIssue('network')
          toast.error(
            'Speech recognition can\'t reach Google\'s servers. See the banner above for help.',
            { duration: 6000 }
          )
          stopListening()
          return
        }

        // Network failures → exponential backoff (500ms, 1s, 1.5s … max 3s)
        // Normal end / silence → restart almost immediately
        const delay = isRealFailure ? Math.min(500 * retryCountRef.current, 3000) : 80
        setTimeout(() => {
          if (isListeningRef.current) launchRecognition()
        }, delay)
      },
    })

    if (!recognition) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      stopListening()
      return
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  // ── Start recording ────────────────────────────────────────────────────────
  function startListening() {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
      return
    }

    retryCountRef.current = 0

    // Set ref BEFORE launch — state updates are async, but the onEnd
    // restart guard runs synchronously inside the callback closure.
    isListeningRef.current = true
    setIsListening(true)
    setStatus('listening')

    launchRecognition()

    // Duration timer: tick every second
    durationTimerRef.current = setInterval(() => {
      setDurationSeconds((s) => s + 1)
    }, 1_000)

    // Auto-save transcript every 30 s
    autoSaveTimerRef.current = setInterval(() => saveTranscript(), 30_000)

    // Note generation interval: every 60 s if ≥ 40 pending words
    noteIntervalRef.current = setInterval(() => {
      const words = countWords(pendingBufferRef.current.join(' '))
      if (words >= 40) handleGenerateNotes()
    }, 60_000)
  }

  // ── Stop recording ─────────────────────────────────────────────────────────
  function stopListening() {
    // Update ref FIRST so the onEnd auto-restart guard sees it
    isListeningRef.current = false
    setIsListening(false)
    setStatus('idle')
    setInterimText('')

    try { recognitionRef.current?.stop() } catch { /* ignore */ }
    recognitionRef.current = null

    clearInterval(durationTimerRef.current)
    clearInterval(autoSaveTimerRef.current)
    clearInterval(noteIntervalRef.current)

    saveTranscript(true)
  }

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      try { recognitionRef.current?.stop() } catch { /* ignore */ }
      clearInterval(durationTimerRef.current)
      clearInterval(autoSaveTimerRef.current)
      clearInterval(noteIntervalRef.current)
    }
  }, [])

  // ── Save session title ─────────────────────────────────────────────────────
  async function commitTitle() {
    const trimmed = editDraft.trim() || 'Untitled Session'
    setSessionTitle(trimmed)
    setIsEditingTitle(false)
    await supabase.from('sessions').update({ title: trimmed }).eq('id', id)
  }

  function startEditingTitle() {
    setEditDraft(sessionTitle)
    setIsEditingTitle(true)
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExport() {
    toast.info('Export functionality coming in Step 7!')
  }

  // ─────────────────────────────────────────────────────────────────────────
  const pendingWordCount = countWords(pendingBuffer.join(' '))

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <Mic className="size-8 opacity-40" />
          <span className="text-sm">Loading session…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col">

      {/* ── Browser warning banner ──────────────────────────────────────── */}
      {(isBrave || speechIssue === 'network') && !bannerDismissed && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 space-y-1">
            {isBrave ? (
              <>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Brave browser detected — Web Speech API may not work
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  Brave's privacy shields block Google's speech recognition servers.
                  Fix options:
                </p>
                <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-0.5">
                  <li>
                    <strong>Easiest:</strong> Use{' '}
                    <a
                      href="https://www.google.com/chrome/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline inline-flex items-center gap-0.5 hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      Google Chrome <ExternalLink className="size-3" />
                    </a>
                    {' '}for this page.
                  </li>
                  <li>
                    <strong>In Brave:</strong> Click the{' '}
                    <strong>Shields icon</strong> (lion) in the address bar →
                    set <em>Fingerprinting</em> to <em>"Allow all"</em> →
                    reload the page.
                  </li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  Speech recognition can't reach Google's servers
                </p>
                <p className="text-amber-800 dark:text-amber-300">
                  The Web Speech API sends audio to Google's servers. If you're using a VPN,
                  corporate network, or Brave browser, it may be blocked. Try:
                </p>
                <ul className="list-disc list-inside text-amber-800 dark:text-amber-300 space-y-0.5">
                  <li>Switch to Google Chrome</li>
                  <li>Disable VPN / proxy temporarily</li>
                  <li>Check your network connection to google.com</li>
                </ul>
              </>
            )}
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 text-amber-600 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-100 transition-colors"
            aria-label="Dismiss warning"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* ── Top Bar ───────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-2 border-b px-3 py-2.5 shrink-0 flex-wrap md:flex-nowrap">

        {/* Back button — plain Link styled as icon button (asChild not supported by @base-ui Button) */}
        <Link
          to="/dashboard"
          aria-label="Back to dashboard"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>

        {/* Editable session title */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-1">
              <Input
                ref={titleInputRef}
                id="session-title-input"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitTitle()
                  if (e.key === 'Escape') setIsEditingTitle(false)
                }}
                className="h-7 text-sm font-medium w-52 max-w-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={commitTitle}
                aria-label="Save title"
              >
                <Check className="size-3.5 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setIsEditingTitle(false)}
                aria-label="Cancel"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <button
              id="session-title-btn"
              onClick={startEditingTitle}
              className="flex items-center gap-1.5 group text-sm font-semibold truncate hover:text-primary transition-colors"
              title="Click to rename"
            >
              <span className="truncate max-w-[220px]">{sessionTitle}</span>
              <Pencil className="size-3 opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
            </button>
          )}
        </div>

        {/* Status badge */}
        <StatusBadge status={status} />

        {/* Duration */}
        <span
          className="text-xs text-muted-foreground font-mono tabular-nums hidden sm:block shrink-0"
          aria-label="Recording duration"
        >
          {formatDuration(durationSeconds)}
        </span>

        {/* Language selector (native select — no library dependency) */}
        <select
          id="language-select"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          disabled={isListening}
          className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
          aria-label="Recognition language"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>

        {/* Start / Stop recording */}
        <Button
          id="record-toggle-btn"
          size="sm"
          variant={isListening ? 'destructive' : 'default'}
          onClick={isListening ? stopListening : startListening}
          className="gap-1.5 shrink-0"
        >
          {isListening ? (
            <>
              <MicOff className="size-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="size-4" />
              Start Recording
            </>
          )}
        </Button>

        {/* Export */}
        <Button
          id="export-btn"
          size="sm"
          variant="outline"
          onClick={handleExport}
          className="gap-1.5 shrink-0"
        >
          <Download className="size-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>

        <ThemeToggle />
      </header>

      {/* ── Resizable split panels ────────────────────────────────────────── */}
      <ResizablePanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
      >
        {/* LEFT — Live Transcript */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col border-r">
            <div className="shrink-0 px-5 py-2 border-b bg-muted/30">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Live Transcript
              </h2>
            </div>
            <TranscriptPanel
              finalSegments={finalSegments}
              interimText={interimText}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* RIGHT — Smart Notes */}
        <ResizablePanel defaultSize={50} minSize={20}>
          <NotesPanel
            notes={notes}
            onGenerateNow={handleGenerateNotes}
            isProcessing={isProcessing}
            pendingWordCount={pendingWordCount}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
