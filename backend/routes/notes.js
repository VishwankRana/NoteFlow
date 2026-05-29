import { Router } from 'express'
import { generateNotesFromTranscript } from '../lib/claude.js'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/generate-notes
//
// Body: { transcript: string, sessionId: string }
//
// 1. Calls Claude to extract structured notes from the transcript chunk.
// 2. Saves the note to the `notes` table in Supabase.
// 3. Returns the saved note object (with DB-assigned id and created_at).
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { transcript, sessionId } = req.body

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
    return res.status(400).json({ error: 'transcript is required and must be a non-empty string' })
  }
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' })
  }

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 10) {
    return res.status(400).json({ error: `Transcript too short (${wordCount} words). Need at least 10.` })
  }

  // ── Call Claude ──────────────────────────────────────────────────────────────
  let noteData
  try {
    noteData = await generateNotesFromTranscript(transcript)
  } catch (err) {
    console.error('Claude API error:', err.message)
    return res.status(502).json({ error: `AI generation failed: ${err.message}` })
  }

  // ── Save to Supabase ─────────────────────────────────────────────────────────
  const { data, error: dbError } = await supabase
    .from('notes')
    .insert({
      session_id: sessionId,
      topic: noteData.topic,
      summary: noteData.summary,
      key_points: noteData.keyPoints,
      transcript_chunk: transcript,
    })
    .select('id, topic, summary, key_points, transcript_chunk, created_at')
    .single()

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return res.status(500).json({ error: dbError.message })
  }

  // ── Respond ──────────────────────────────────────────────────────────────────
  // Normalize to camelCase for the frontend
  return res.status(201).json({
    id: data.id,
    topic: data.topic,
    summary: data.summary,
    keyPoints: data.key_points ?? [],
    transcriptChunk: data.transcript_chunk,
    createdAt: data.created_at,
  })
})

export default router
