import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/sessions
// Create a new recording session for a user.
// Body: { userId: string }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title: 'Untitled Session',
    })
    .select('id, title, created_at')
    .single()

  if (error) {
    console.error('POST /api/sessions error:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(201).json(data)
})

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/sessions/:id
// Update a session's title and/or full transcript.
// Body: { title?: string, full_transcript?: string, duration_seconds?: number }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { title, full_transcript, duration_seconds } = req.body

  const updates = { updated_at: new Date().toISOString() }
  if (title !== undefined)            updates.title = title
  if (full_transcript !== undefined)  updates.full_transcript = full_transcript
  if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select('id, title, updated_at')
    .single()

  if (error) {
    console.error(`PATCH /api/sessions/${id} error:`, error)
    return res.status(500).json({ error: error.message })
  }

  return res.json(data)
})

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/sessions/:id
// Delete a session and cascade-delete its notes.
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  // Delete notes first (or rely on Supabase cascade if configured)
  await supabase.from('notes').delete().eq('session_id', id)

  const { error } = await supabase.from('sessions').delete().eq('id', id)

  if (error) {
    console.error(`DELETE /api/sessions/${id} error:`, error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(204).send()
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/sessions/:id/notes
// Return all notes for a session, ordered oldest first.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id/notes', async (req, res) => {
  const { id } = req.params

  const { data, error } = await supabase
    .from('notes')
    .select('id, topic, summary, key_points, transcript_chunk, created_at')
    .eq('session_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error(`GET /api/sessions/${id}/notes error:`, error)
    return res.status(500).json({ error: error.message })
  }

  // Normalize key_points → keyPoints for the frontend
  const notes = (data || []).map((n) => ({
    id: n.id,
    topic: n.topic,
    summary: n.summary,
    keyPoints: n.key_points ?? [],
    transcriptChunk: n.transcript_chunk,
    createdAt: n.created_at,
  }))

  return res.json(notes)
})

export default router
