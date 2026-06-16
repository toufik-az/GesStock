import 'dotenv/config'

export const env = {
  SUPABASE_URL:             process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY:        process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  PORT:                     parseInt(process.env.PORT ?? '3001', 10),
  FRONTEND_URL:             process.env.FRONTEND_URL ?? 'http://localhost:5173',
  NODE_ENV:                 process.env.NODE_ENV ?? 'development',
}

const missing = (Object.keys(env) as (keyof typeof env)[]).filter(k => !env[k])
if (missing.length) {
  throw new Error(`Missing env vars: ${missing.join(', ')}`)
}
