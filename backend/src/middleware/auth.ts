import type { Request, Response, NextFunction } from 'express'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env'

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Non authentifié' })
    return
  }

  // Verify the JWT against Supabase
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)
  const { data: { user }, error } = await client.auth.getUser(token)

  if (error || !user) {
    res.status(401).json({ error: 'Token invalide ou expiré' })
    return
  }

  req.user = user
  next()
}

export function requireGerant(req: Request, res: Response, next: NextFunction) {
  if (req.user?.app_metadata?.role !== 'gerant') {
    res.status(403).json({ error: 'Réservé au gérant' })
    return
  }
  next()
}
