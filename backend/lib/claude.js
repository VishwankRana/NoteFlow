import Groq from 'groq-sdk'

const apiKey = process.env.GROQ_API_KEY

if (!apiKey) {
  console.error('❌  GROQ_API_KEY must be set in backend/.env')
  console.error('   Get a free key at: https://console.groq.com/keys')
  process.exit(1)
}

const client = new Groq({ apiKey })

// Groq's JSON mode guarantees a valid JSON response — no need to strip fences
const SYSTEM_PROMPT = `You are a note-taking assistant. Given a raw spoken transcript chunk, extract structured notes. Return ONLY a valid JSON object with no markdown formatting, no backticks, no extra text. The JSON must have exactly these fields:
{
  "topic": "string (short title for this chunk, max 6 words)",
  "summary": "string (1-2 sentence overview)",
  "keyPoints": ["string", "string"] (3-6 concise bullet points)
}`

/**
 * Generate structured notes from a transcript chunk using Groq (free).
 *
 * @param {string} transcript  Raw spoken transcript text
 * @returns {Promise<{topic: string, summary: string, keyPoints: string[]}>}
 */
export async function generateNotesFromTranscript(transcript) {
  const completion = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant',   // Free, extremely fast (300+ tok/s)
    max_tokens: 1024,
    temperature: 0.3,
    response_format: { type: 'json_object' },  // Guarantees valid JSON output
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Here is the transcript chunk to convert into structured notes:\n\n${transcript}`,
      },
    ],
  })

  const rawText = completion.choices[0]?.message?.content?.trim() ?? ''

  let parsed
  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error(`AI returned invalid JSON: ${rawText.slice(0, 200)}`)
  }

  // Validate expected shape
  if (
    typeof parsed.topic !== 'string' ||
    typeof parsed.summary !== 'string' ||
    !Array.isArray(parsed.keyPoints)
  ) {
    throw new Error('AI response missing required fields (topic, summary, keyPoints)')
  }

  return {
    topic: parsed.topic.trim(),
    summary: parsed.summary.trim(),
    keyPoints: parsed.keyPoints.map((k) => String(k).trim()).filter(Boolean),
  }
}
