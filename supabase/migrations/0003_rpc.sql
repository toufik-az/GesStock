-- GesStock — Migration 0003: RPCs (transactional business logic)
-- Run AFTER 0002_security.sql

-- ─── enregistrer_vente ─────────────────────────────────────────────────────
-- Called by Caisse page. Checks stock, inserts vente + lignes, decrements stock.
-- p_lignes: [{produit_id, nom_produit, quantite, prix_unitaire, prix_achat}]
create or replace function public.enregistrer_vente(
  p_lignes       jsonb,
  p_montant_recu numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id     uuid;
  v_caissier_id  uuid;
  v_total        numeric := 0;
  v_vente_id     uuid;
  v_ligne        jsonb;
  v_produit_id   uuid;
  v_quantite     numeric;
  v_stock        numeric;
begin
  v_caissier_id := auth.uid();
  select store_id into v_store_id from public.profiles where id = v_caissier_id;

  if v_store_id is null then
    raise exception 'Profil introuvable';
  end if;

  -- Compute total
  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    v_total := v_total +
      (v_ligne->>'quantite')::numeric * (v_ligne->>'prix_unitaire')::numeric;
  end loop;

  -- Verify stock availability
  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    v_produit_id := (v_ligne->>'produit_id')::uuid;
    v_quantite   := (v_ligne->>'quantite')::numeric;

    if v_produit_id is not null then
      select quantite into v_stock
        from public.produits
       where id = v_produit_id and store_id = v_store_id;

      if v_stock is null then
        raise exception 'Produit introuvable : %', (v_ligne->>'nom_produit');
      end if;

      if v_stock < v_quantite then
        raise exception 'Stock insuffisant pour : %', (v_ligne->>'nom_produit');
      end if;
    end if;
  end loop;

  -- Insert vente
  insert into public.ventes
    (store_id, caissier_id, total, montant_recu, monnaie_rendue)
  values
    (v_store_id, v_caissier_id, v_total, p_montant_recu, p_montant_recu - v_total)
  returning id into v_vente_id;

  -- Insert lignes + decrement stock
  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    v_produit_id := (v_ligne->>'produit_id')::uuid;
    v_quantite   := (v_ligne->>'quantite')::numeric;

    insert into public.lignes_vente
      (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat)
    values (
      v_store_id,
      v_vente_id,
      v_produit_id,
      v_ligne->>'nom_produit',
      v_quantite,
      (v_ligne->>'prix_unitaire')::numeric,
      (v_ligne->>'prix_achat')::numeric
    );

    if v_produit_id is not null then
      update public.produits
         set quantite = quantite - v_quantite
       where id = v_produit_id and store_id = v_store_id;
    end if;
  end loop;

  return v_vente_id;
end;
$$;

-- ─── enregistrer_reception ─────────────────────────────────────────────────
-- p_lignes: [{produit_id, quantite, prix_achat}]
create or replace function public.enregistrer_reception(
  p_fournisseur_id uuid,
  p_lignes         jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id    uuid;
  v_reception_id uuid;
  v_ligne       jsonb;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  if v_store_id is null then
    raise exception 'Profil introuvable';
  end if;

  if (select role from public.profiles where id = auth.uid()) <> 'gerant' then
    raise exception 'Accès refusé — réservé au gérant';
  end if;

  insert into public.receptions (store_id, fournisseur_id)
  values (v_store_id, p_fournisseur_id)
  returning id into v_reception_id;

  for v_ligne in select * from jsonb_array_elements(p_lignes) loop
    insert into public.lignes_reception
      (store_id, reception_id, produit_id, quantite, prix_achat)
    values (
      v_store_id,
      v_reception_id,
      (v_ligne->>'produit_id')::uuid,
      (v_ligne->>'quantite')::numeric,
      case when v_ligne->>'prix_achat' is not null
           then (v_ligne->>'prix_achat')::numeric
           else null end
    );

    update public.produits
       set quantite = quantite + (v_ligne->>'quantite')::numeric
     where id = (v_ligne->>'produit_id')::uuid
       and store_id = v_store_id;
  end loop;

  return v_reception_id;
end;
$$;

-- ─── dashboard_kpis ────────────────────────────────────────────────────────
create or replace function public.dashboard_kpis(
  p_debut timestamptz,
  p_fin   timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id  uuid;
  v_ca        numeric;
  v_nb        integer;
  v_marge     numeric;
  v_alertes   integer;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  select coalesce(sum(total), 0) into v_ca
    from public.ventes
   where store_id = v_store_id and date_heure between p_debut and p_fin;

  select count(*)::integer into v_nb
    from public.ventes
   where store_id = v_store_id and date_heure between p_debut and p_fin;

  select coalesce(sum(lv.quantite * (lv.prix_unitaire - lv.prix_achat)), 0) into v_marge
    from public.lignes_vente lv
    join public.ventes v on v.id = lv.vente_id
   where v.store_id = v_store_id and v.date_heure between p_debut and p_fin;

  select count(*)::integer into v_alertes
    from public.produits
   where store_id = v_store_id and quantite <= quantite_min;

  return jsonb_build_object(
    'ca',       v_ca,
    'nb_ventes', v_nb,
    'marge',    v_marge,
    'alertes',  v_alertes
  );
end;
$$;

-- ─── top_produits ──────────────────────────────────────────────────────────
create or replace function public.top_produits(
  p_debut timestamptz,
  p_fin   timestamptz
)
returns table(nom text, quantite_vendue numeric, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare v_store_id uuid;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  return query
    select
      lv.nom_produit,
      sum(lv.quantite),
      sum(lv.quantite * lv.prix_unitaire)
    from public.lignes_vente lv
    join public.ventes v on v.id = lv.vente_id
   where v.store_id = v_store_id and v.date_heure between p_debut and p_fin
   group by lv.nom_produit
   order by sum(lv.quantite) desc
   limit 5;
end;
$$;

-- ─── ventes_par_jour ───────────────────────────────────────────────────────
create or replace function public.ventes_par_jour(
  p_debut timestamptz,
  p_fin   timestamptz
)
returns table(jour text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare v_store_id uuid;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  return query
    select
      to_char(date_heure at time zone 'Africa/Algiers', 'DD/MM') as jour,
      sum(total)
    from public.ventes
   where store_id = v_store_id and date_heure between p_debut and p_fin
   group by
     to_char(date_heure at time zone 'Africa/Algiers', 'DD/MM'),
     date_trunc('day', date_heure at time zone 'Africa/Algiers')
   order by date_trunc('day', date_heure at time zone 'Africa/Algiers');
end;
$$;

-- ─── ventes_par_categorie ──────────────────────────────────────────────────
create or replace function public.ventes_par_categorie(
  p_debut timestamptz,
  p_fin   timestamptz
)
returns table(categorie text, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare v_store_id uuid;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  return query
    select
      coalesce(c.nom, 'Autre') as categorie,
      sum(lv.quantite * lv.prix_unitaire) as total
    from public.lignes_vente lv
    join public.ventes v      on v.id  = lv.vente_id
    left join public.produits p on p.id = lv.produit_id
    left join public.categories c on c.id = p.categorie_id
   where v.store_id = v_store_id and v.date_heure between p_debut and p_fin
   group by c.id, c.nom
   order by total desc;
end;
$$;

-- ─── dernieres_ventes ──────────────────────────────────────────────────────
create or replace function public.dernieres_ventes()
returns table(id uuid, date_heure timestamptz, total numeric, nom_caissier text)
language plpgsql
security definer
set search_path = public
as $$
declare v_store_id uuid;
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  return query
    select v.id, v.date_heure, v.total, pr.nom
    from public.ventes v
    join public.profiles pr on pr.id = v.caissier_id
   where v.store_id = v_store_id
   order by v.date_heure desc
   limit 5;
end;
$$;
