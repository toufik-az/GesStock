-- Migration 0005: creer_produit_rapide RPC
-- Allows caissiers (and gérants) to create a minimal product record from the POS.
-- SECURITY DEFINER so it runs as the function owner (bypasses RLS),
-- but it reads auth_store_id() / auth_role() to scope the insert safely.

CREATE OR REPLACE FUNCTION creer_produit_rapide(
  p_nom         text,
  p_code_barre  text     DEFAULT NULL,
  p_prix_achat  numeric  DEFAULT 0,
  p_prix_vente  numeric  DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_store_id  uuid := auth_store_id();
  v_role      text := auth_role();
  v_produit   produits%ROWTYPE;
BEGIN
  -- Only staff of a known store may call this
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  -- Both gérant and caissier are allowed; anonymous users are not
  IF v_role NOT IN ('gerant', 'caissier') THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  INSERT INTO produits (
    store_id, nom, code_barre,
    prix_achat, prix_vente,
    quantite, quantite_min,
    unite
  )
  VALUES (
    v_store_id,
    trim(p_nom),
    nullif(trim(p_code_barre), ''),
    p_prix_achat,
    p_prix_vente,
    0, 0,
    'Pièce'
  )
  RETURNING * INTO v_produit;

  RETURN to_jsonb(v_produit);
END;
$$;

-- Revoke default public execute, grant only to authenticated users
REVOKE ALL ON FUNCTION creer_produit_rapide(text, text, numeric, numeric) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION creer_produit_rapide(text, text, numeric, numeric) TO authenticated;
