import { supabase } from './supabase'

/**
 * Sign up with email + password.
 * Supabase sends a confirmation email by default; you can disable that in
 * the Supabase dashboard under Auth → Settings → "Enable email confirmations".
 */
export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return data
}

/** Sign in with email + password. */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign out the current user. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Returns the current session, or null if not logged in. */
export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}
