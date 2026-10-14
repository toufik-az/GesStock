import { Router, type Request, type Response } from 'express'
import { requireAuth, requireGerant } from '../middleware/auth'
import { supabaseAdmin } from '../lib/supabaseAdmin'

const router = Router()
router.use(requireAuth, requireGerant)

// GET /staff — list all caissiers for the caller's store
router.get('/', async (req: Request, res: Response) => {
  const storeId = req.user!.app_metadata?.store_id as string
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, nom, role, actif, created_at')
    .eq('store_id', storeId)
    .eq('role', 'caissier')
    .order('created_at')
  if (error) { res.status(500).json({ error: error.message }); return }
  res.json(data)
})

// POST /staff — create a caissier account
router.post('/', async (req: Request, res: Response) => {
  const storeId = req.user!.app_metadata?.store_id as string
  const { email, password, nom } = req.body as { email?: string; password?: string; nom?: string }

  if (!email || !password || !nom) {
    res.status(400).json({ error: 'email, password et nom sont obligatoires' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' })
    return
  }

  let authUserId: string | null = null
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) throw authError
    authUserId = authData.user.id

    await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: { store_id: storeId, role: 'caissier' },
    })

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: authUserId, store_id: storeId, role: 'caissier', nom, actif: true })
      .select()
      .single()
    if (profileError) throw profileError

    res.status(201).json(profile)
  } catch (err: unknown) {
    if (authUserId) await supabaseAdmin.auth.admin.deleteUser(authUserId).catch(() => null)
    const message = err instanceof Error ? err.message : 'Erreur interne'
    res.status(500).json({ error: message })
  }
})

// PATCH /staff/:id — update name or active status
router.patch('/:id', async (req: Request, res: Response) => {
  const storeId = req.user!.app_metadata?.store_id as string
  const { id } = req.params
  const { nom, actif } = req.body as { nom?: string; actif?: boolean }

  const updates: Record<string, unknown> = {}
  if (nom !== undefined) updates.nom = nom
  if (actif !== undefined) updates.actif = actif

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('store_id', storeId)
    .eq('role', 'caissier')
    .select()
    .single()
  if (error) { res.status(500).json({ error: error.message }); return }
  if (!data) { res.status(404).json({ error: 'Caissier introuvable' }); return }
  res.json(data)
})

// DELETE /staff/:id — delete caissier account
router.delete('/:id', async (req: Request, res: Response) => {
  const storeId = req.user!.app_metadata?.store_id as string
  const { id } = req.params

  // Verify the profile belongs to this store
  const { data: profile, error: fetchError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', id)
    .eq('store_id', storeId)
    .eq('role', 'caissier')
    .single()

  if (fetchError || !profile) {
    res.status(404).json({ error: 'Caissier introuvable' })
    return
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id as string)
  if (deleteError) { res.status(500).json({ error: deleteError.message }); return }

  res.json({ message: 'Caissier supprimé' })
})

export default router
