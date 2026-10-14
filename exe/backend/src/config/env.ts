import 'dotenv/config'

export const env = {
  SUPABASE_URL:             process.env.SUPABASE_URL!,
  SUPABASE_ANON_KEY:        process.env.SUPABASE_ANON_KEY!,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  PORT:                     parseInt(process.env.PORT ?? '3001', 10),
  // Comma-separated browser origins. Android uses the bundled HTTPS origin below.
  FRONTEND_URL:             process.env.FRONTEND_URL ?? 'http://localhost:5173',
  NODE_ENV:                 process.env.NODE_ENV ?? 'development',
}

const missing = (Object.keys(env) as (keyof typeof env)[]).filter(k => !env[k])
if (missing.length) {
  throw new Error(`Missing env vars: ${missing.join(', ')}`)
}

if (!Number.isInteger(env.PORT) || env.PORT < 1 || env.PORT > 65535) {
  throw new Error('PORT must be an integer from 1 to 65535')
}
