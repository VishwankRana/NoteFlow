import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌  SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend/.env')
  process.exit(1)
}

/**
 * Service-role client — bypasses RLS.
 * Only used server-side; never exposed to the browser.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    // Prevent the SDK from trying to persist a session in Node (there is no localStorage)
    persistSession: false,
    autoRefreshToken: false,
  },
})
