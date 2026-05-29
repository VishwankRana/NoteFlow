import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import sessionsRouter from './routes/sessions.js'
import notesRouter from './routes/notes.js'

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '2mb' }))    // transcripts can be long

// ─── Request logger (dev only) ────────────────────────────────────────────────

app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`)
  next()
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/sessions', sessionsRouter)
app.use('/api/generate-notes', notesRouter)

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_KEY,
      groq: !!process.env.GROQ_API_KEY,
    },
  })
})

// ─── 404 catch-all ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀  NoteFlow backend running on http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})
