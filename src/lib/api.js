const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

/**
 * POST /api/sessions — create a new session record
 * @param {string} userId  Supabase user id
 * @returns {Promise<{id: string}>}
 */
export async function createSession(userId) {
  const res = await fetch(`${BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * PATCH /api/sessions/:id — update title or full_transcript
 */
export async function updateSession(id, fields) {
  const res = await fetch(`${BASE_URL}/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * DELETE /api/sessions/:id
 */
export async function deleteSession(id) {
  const res = await fetch(`${BASE_URL}/api/sessions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(await res.text())
}

/**
 * GET /api/sessions/:id/notes — fetch all notes for a session
 */
export async function getSessionNotes(sessionId) {
  const res = await fetch(`${BASE_URL}/api/sessions/${sessionId}/notes`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

/**
 * POST /api/generate-notes
 * @param {{ transcript: string, sessionId: string }} params
 * @returns {Promise<{id, topic, summary, keyPoints, created_at}>}
 */
export async function generateNotes({ transcript, sessionId }) {
  const res = await fetch(`${BASE_URL}/api/generate-notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, sessionId }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
