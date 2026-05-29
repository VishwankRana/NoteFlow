/**
 * Creates and configures a Web Speech API SpeechRecognition instance.
 * Returns null if the browser does not support it.
 *
 * @param {Object}   opts
 * @param {string}   opts.lang        BCP-47 language tag, e.g. 'en-US'
 * @param {boolean}  opts.continuous  true = long session, false = one utterance at a time
 * @param {Function} opts.onInterim   called with the current interim text (string)
 * @param {Function} opts.onFinal     called with each finalized transcript chunk (string)
 * @param {Function} opts.onError     called with the SpeechRecognitionErrorEvent
 * @param {Function} opts.onEnd       called when the recognition session ends
 */
export function createSpeechRecognition({
  lang = 'en-US',
  continuous = true,    // true = long-running session, best for live transcription
  onInterim,
  onFinal,
  onError,
  onEnd,
} = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const recognition = new SpeechRecognition()
  recognition.continuous = continuous
  recognition.interimResults = true
  recognition.lang = lang
  recognition.maxAlternatives = 1

  // Track the last error code so onEnd can make smarter restart decisions
  let lastErrorCode = null

  recognition.onresult = (event) => {
    lastErrorCode = null   // clear on any successful result
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        onFinal?.(text)
      } else {
        interim += text
      }
    }
    onInterim?.(interim)
  }

  recognition.onerror = (event) => {
    lastErrorCode = event.error
    if (event.error !== 'no-speech') {
      onError?.(event)
    }
  }

  // Pass lastErrorCode to onEnd so the caller knows WHY it ended
  recognition.onend = () => {
    onEnd?.(lastErrorCode)
    lastErrorCode = null
  }

  return recognition
}

/** Returns true if the Web Speech API is available in this browser. */
export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

/**
 * Asynchronously detects the Brave browser.
 * Brave exposes navigator.brave.isBrave().
 */
export async function detectBrave() {
  try {
    if (navigator.brave && typeof navigator.brave.isBrave === 'function') {
      return await navigator.brave.isBrave()
    }
  } catch { /* ignore */ }
  return false
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'es-ES', label: 'Spanish (ES)' },
]

