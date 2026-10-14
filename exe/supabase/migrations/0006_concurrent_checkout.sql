-- Apply after 0005. Serializes sales of the same product across APK and desktop.
-- No existing rows are changed. All checkout changes commit or roll back together.
create or replace function public.enregistrer_vente(p_lignes jsonb, p_montant_recu numeric)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store uuid;
  v_sale uuid;
  v_line jsonb;
  v_product public.produits%rowtype;
  v_quantity numeric;
  v_total numeric := 0;
begin
  select store_id into v_store from public.profiles
    where id = auth.uid() and actif = true;
  if v_store is null then raise exception 'Compte inactif ou profil introuvable'; end if;
  if p_lignes is null or jsonb_typeof(p_lignes) <> 'array' then
    raise exception 'Panier invalide';
  end if;
  if jsonb_array_length(p_lignes) = 0 then raise exception 'Panier vide'; end if;
  if exists (select 1 from jsonb_array_elements(p_lignes) l
             group by l->>'produit_id' having count(*) > 1) then
    raise exception 'Produit en double dans le panier';
  end if;

  -- Lock in a stable order to prevent deadlocks between multi-product checkouts.
  for v_line in select value from jsonb_array_elements(p_lignes) order by value->>'produit_id' loop
    v_quantity := (v_line->>'quantite')::numeric;
    if v_quantity is null or v_quantity <= 0 or v_quantity::text in ('NaN', 'Infinity', '-Infinity')
       or v_quantity <> round(v_quantity, 3) then
      raise exception 'Quantité invalide';
    end if;
    select * into v_product from public.produits
      where id = (v_line->>'produit_id')::uuid and store_id = v_store for update;
    if not found then raise exception 'Produit introuvable'; end if;
    if v_product.quantite < v_quantity then
      raise exception 'Stock insuffisant pour : %', v_product.nom;
    end if;
    if (v_line->>'prix_unitaire')::numeric is distinct from v_product.prix_vente then
      raise exception 'Le prix de % a changé. Actualisez le panier.', v_product.nom;
    end if;
    v_total := v_total + v_quantity * v_product.prix_vente;
  end loop;
  v_total := round(v_total, 2);
  if p_montant_recu is null or p_montant_recu::text in ('NaN', 'Infinity', '-Infinity')
     or p_montant_recu < v_total then raise exception 'Montant reçu insuffisant ou invalide'; end if;

  insert into public.ventes (store_id, caissier_id, total, montant_recu, monnaie_rendue)
    values (v_store, auth.uid(), v_total, p_montant_recu, p_montant_recu - v_total)
    returning id into v_sale;
  for v_line in select value from jsonb_array_elements(p_lignes) loop
    select * into v_product from public.produits where id = (v_line->>'produit_id')::uuid and store_id = v_store;
    v_quantity := (v_line->>'quantite')::numeric;
    insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat)
      values (v_store, v_sale, v_product.id, v_product.nom, v_quantity, v_product.prix_vente, v_product.prix_achat);
    update public.produits set quantite = quantite - v_quantity where id = v_product.id and store_id = v_store;
  end loop;
  return v_sale;
end;
$$;
revoke all on function public.enregistrer_vente(jsonb, numeric) from public, anon;
grant execute on function public.enregistrer_vente(jsonb, numeric) to authenticated;
