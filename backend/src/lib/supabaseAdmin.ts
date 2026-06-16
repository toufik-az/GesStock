import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

// Service-role client — bypasses RLS. Never expose to the browser.
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
