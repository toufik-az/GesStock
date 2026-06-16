import { Router, type Request, type Response } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const router = Router()

// POST /auth/register — create store + gérant account
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, nom_magasin, nom_gerant } = req.body as {
    email?: string
    password?: string
    nom_magasin?: string
    nom_gerant?: string
  }

  if (!email || !password || !nom_magasin || !nom_gerant) {
    res.status(400).json({ error: 'Tous les champs sont obligatoires' })
    return
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    return
  }

  let authUserId: string | null = null

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError
    authUserId = authData.user.id

    // 2. Create store
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .insert({ nom: nom_magasin })
      .select()
      .single()
    if (storeError) throw storeError

    // 3. Set app_metadata with store_id + role
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: { store_id: store.id, role: 'gerant' },
    })
    if (metaError) throw metaError

    // 4. Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authUserId,
      store_id: store.id,
      role: 'gerant',
      nom: nom_gerant,
      actif: true,
    })
    if (profileError) throw profileError

    res.status(201).json({ message: 'Compte créé avec succès' })
  } catch (err: unknown) {
    // Rollback: delete auth user if store/profile creation failed
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => null)
    }
    const message = err instanceof Error ? err.message : 'Erreur interne'
    res.status(500).json({ error: message })
  }
})

export default router
