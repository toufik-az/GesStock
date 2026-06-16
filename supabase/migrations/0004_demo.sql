-- GesStock — Migration 0004: Demo data seeder
-- Run AFTER 0003_rpc.sql
-- Called from the UI via: SELECT public.charger_demo();

create or replace function public.charger_demo()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id   uuid;
  v_caissier   uuid;
  -- category IDs
  id_boissons  uuid; id_epicerie uuid; id_laitier  uuid; id_fromage  uuid;
  id_boulang   uuid; id_hygiene  uuid; id_menage   uuid; id_divers   uuid;
  -- fournisseur IDs
  id_fourn_a   uuid; id_fourn_b  uuid; id_fourn_c  uuid;
  -- product IDs
  id_coca      uuid; id_fanta    uuid; id_eau_ifri uuid;
  id_sucre     uuid; id_huile    uuid; id_pates    uuid; id_riz      uuid;
  id_lait      uuid; id_yaourt   uuid; id_beurre   uuid;
  id_vache_rit uuid; id_pain     uuid; id_chips    uuid;
  id_savon     uuid; id_javel    uuid;
  -- reception / vente IDs
  v_recep_id   uuid;
  v_vente_id   uuid;
  now_ts       timestamptz := now();
begin
  select store_id into v_store_id from public.profiles where id = auth.uid();

  if v_store_id is null then
    raise exception 'Profil introuvable';
  end if;

  if (select role from public.profiles where id = auth.uid()) <> 'gerant' then
    raise exception 'Accès refusé';
  end if;

  v_caissier := auth.uid();

  -- Purge existing store data
  delete from public.lignes_vente    where store_id = v_store_id;
  delete from public.ventes          where store_id = v_store_id;
  delete from public.lignes_reception where store_id = v_store_id;
  delete from public.receptions      where store_id = v_store_id;
  delete from public.produits        where store_id = v_store_id;
  delete from public.categories      where store_id = v_store_id;
  delete from public.fournisseurs    where store_id = v_store_id;

  -- ── Catégories ────────────────────────────────────────────────────────────
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Boissons',             '#1565C0') returning id into id_boissons;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Épicerie sèche',       '#E65100') returning id into id_epicerie;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Produits laitiers',    '#00695C') returning id into id_laitier;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Fromagerie',           '#F9A825') returning id into id_fromage;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Boulangerie & Snacks', '#6D4C41') returning id into id_boulang;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Hygiène & Beauté',     '#AD1457') returning id into id_hygiene;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Produits ménagers',    '#0277BD') returning id into id_menage;
  insert into public.categories (store_id, nom, couleur) values (v_store_id, 'Divers',               '#6A1B9A') returning id into id_divers;

  -- ── Produits ──────────────────────────────────────────────────────────────
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Coca-Cola 33cL',          '5000112637923', id_boissons, 72,  100, 72,  24, 'Pièce') returning id into id_coca;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Fanta Orange 33cL',       '5000112637945', id_boissons, 68,   92, 48,  12, 'Pièce') returning id into id_fanta;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Eau Ifri 1.5L',           '3282779000023', id_boissons, 42,   60, 96,  24, 'Pièce') returning id into id_eau_ifri;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Sucre blanc 1kg',          null,            id_epicerie, 115, 155, 50,  10, 'Kg')    returning id into id_sucre;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Huile Fleurial 1L',        null,            id_epicerie, 340, 450, 24,   6, 'Pièce') returning id into id_huile;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Pâtes Djazaïr 500g',       null,            id_epicerie,  95, 135, 40,  10, 'Pièce') returning id into id_pates;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Riz Uncle Ben''s 1kg',     '5010067093918', id_epicerie, 220, 300, 20,   6, 'Kg')    returning id into id_riz;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Lait Candia entier 1L',   '3033490004743', id_laitier,  165, 220, 36,   8, 'Pièce') returning id into id_lait;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Yaourt Danone 125g',       null,            id_laitier,   65,  90, 24,   8, 'Pièce') returning id into id_yaourt;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Beurre Président 200g',   '3073781099091', id_laitier,  300, 410, 10,   4, 'Pièce') returning id into id_beurre;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'La Vache Qui Rit 8p',     '7622300420161', id_fromage,  300, 410, 12,   4, 'Pièce') returning id into id_vache_rit;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Pain baguette 250g',       null,            id_boulang,   15,  25, 60,  20, 'Pièce') returning id into id_pain;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Chips Lay''s 60g',         '5000177108440', id_boulang,  160, 220, 24,   8, 'Pièce') returning id into id_chips;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Savon Palmolive 90g',     '8718951182776', id_hygiene,  120, 165, 24,   8, 'Pièce') returning id into id_savon;
  insert into public.produits (store_id, nom, code_barre, categorie_id, prix_achat, prix_vente, quantite, quantite_min, unite) values (v_store_id, 'Eau de Javel 1L',          null,            id_menage,    65,  90, 24,   6, 'Pièce') returning id into id_javel;

  -- ── Fournisseurs ──────────────────────────────────────────────────────────
  insert into public.fournisseurs (store_id, nom, telephone) values (v_store_id, 'Farid & Fils Distribution', '0550 12 34 56') returning id into id_fourn_a;
  insert into public.fournisseurs (store_id, nom, telephone) values (v_store_id, 'Sodibo SARL',               '0770 55 44 33') returning id into id_fourn_b;
  insert into public.fournisseurs (store_id, nom, telephone) values (v_store_id, 'Ben Salah Épicerie Gros',   '0661 87 65 43') returning id into id_fourn_c;

  -- ── Réceptions ────────────────────────────────────────────────────────────
  insert into public.receptions (store_id, fournisseur_id, date_heure) values (v_store_id, id_fourn_a, now_ts - interval '10 days') returning id into v_recep_id;
  insert into public.lignes_reception (store_id, reception_id, produit_id, quantite, prix_achat) values
    (v_store_id, v_recep_id, id_coca,     48, 72),
    (v_store_id, v_recep_id, id_fanta,    24, 68),
    (v_store_id, v_recep_id, id_eau_ifri, 96, 42);

  insert into public.receptions (store_id, fournisseur_id, date_heure) values (v_store_id, id_fourn_c, now_ts - interval '5 days') returning id into v_recep_id;
  insert into public.lignes_reception (store_id, reception_id, produit_id, quantite, prix_achat) values
    (v_store_id, v_recep_id, id_sucre, 30, 115),
    (v_store_id, v_recep_id, id_huile, 24, 340),
    (v_store_id, v_recep_id, id_pates, 40,  95);

  -- ── Ventes (7 jours d'historique) ─────────────────────────────────────────
  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '6 days' + interval '9 hours',  545, 600,  55) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_coca,  'Coca-Cola 33cL',     3, 100, 72),
    (v_store_id, v_vente_id, id_pain,  'Pain baguette 250g', 2,  25, 15),
    (v_store_id, v_vente_id, id_sucre, 'Sucre blanc 1kg',    1, 155, 115);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '6 days' + interval '14 hours', 870, 1000, 130) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_lait,   'Lait Candia entier 1L',  2, 220, 165),
    (v_store_id, v_vente_id, id_yaourt, 'Yaourt Danone 125g',     3,  90,  65),
    (v_store_id, v_vente_id, id_chips,  'Chips Lay''s 60g',       2, 220, 160);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '5 days' + interval '10 hours', 1360, 1500, 140) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_huile,    'Huile Fleurial 1L',   2, 450, 340),
    (v_store_id, v_vente_id, id_savon,    'Savon Palmolive 90g', 3, 165, 120),
    (v_store_id, v_vente_id, id_eau_ifri, 'Eau Ifri 1.5L',       4,  60,  42);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '5 days' + interval '16 hours', 925, 1000,  75) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_pates,     'Pâtes Djazaïr 500g',    2, 135,  95),
    (v_store_id, v_vente_id, id_vache_rit, 'La Vache Qui Rit 8p',   1, 410, 300),
    (v_store_id, v_vente_id, id_pain,      'Pain baguette 250g',    4,  25,  15),
    (v_store_id, v_vente_id, id_coca,      'Coca-Cola 33cL',        1, 100,  72);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '4 days' + interval '8 hours',   660,  700,  40) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_eau_ifri, 'Eau Ifri 1.5L',       6, 60, 42),
    (v_store_id, v_vente_id, id_fanta,    'Fanta Orange 33cL',   3, 92, 68),
    (v_store_id, v_vente_id, id_pain,     'Pain baguette 250g',  2, 25, 15);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '4 days' + interval '18 hours', 1820, 2000, 180) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_riz,    'Riz Uncle Ben''s 1kg',  2, 300, 220),
    (v_store_id, v_vente_id, id_beurre, 'Beurre Président 200g', 1, 410, 300),
    (v_store_id, v_vente_id, id_lait,   'Lait Candia entier 1L', 3, 220, 165),
    (v_store_id, v_vente_id, id_javel,  'Eau de Javel 1L',       2,  90,  65);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '3 days' + interval '11 hours',  975, 1000,  25) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_coca,  'Coca-Cola 33cL',     5, 100,  72),
    (v_store_id, v_vente_id, id_chips, 'Chips Lay''s 60g',   2, 220, 160),
    (v_store_id, v_vente_id, id_sucre, 'Sucre blanc 1kg',    1, 155, 115);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '3 days' + interval '15 hours', 1340, 1500, 160) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_huile,  'Huile Fleurial 1L',     1, 450, 340),
    (v_store_id, v_vente_id, id_pates,  'Pâtes Djazaïr 500g',    3, 135,  95),
    (v_store_id, v_vente_id, id_yaourt, 'Yaourt Danone 125g',    2,  90,  65),
    (v_store_id, v_vente_id, id_pain,   'Pain baguette 250g',    3,  25,  15);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '2 days' + interval '9 hours',   810, 1000, 190) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_lait,  'Lait Candia entier 1L',  2, 220, 165),
    (v_store_id, v_vente_id, id_savon, 'Savon Palmolive 90g',    2, 165, 120),
    (v_store_id, v_vente_id, id_fanta, 'Fanta Orange 33cL',      2,  92,  68);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '1 day'  + interval '10 hours', 1605, 2000, 395) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_vache_rit, 'La Vache Qui Rit 8p',  2, 410, 300),
    (v_store_id, v_vente_id, id_riz,       'Riz Uncle Ben''s 1kg', 1, 300, 220),
    (v_store_id, v_vente_id, id_eau_ifri,  'Eau Ifri 1.5L',        4,  60,  42),
    (v_store_id, v_vente_id, id_chips,     'Chips Lay''s 60g',     1, 220, 160),
    (v_store_id, v_vente_id, id_pain,      'Pain baguette 250g',   5,  25,  15);

  insert into public.ventes (store_id, caissier_id, date_heure, total, montant_recu, monnaie_rendue) values (v_store_id, v_caissier, now_ts - interval '2 hours',                       720,  800,  80) returning id into v_vente_id;
  insert into public.lignes_vente (store_id, vente_id, produit_id, nom_produit, quantite, prix_unitaire, prix_achat) values
    (v_store_id, v_vente_id, id_coca,  'Coca-Cola 33cL',     4, 100, 72),
    (v_store_id, v_vente_id, id_pain,  'Pain baguette 250g', 3,  25, 15),
    (v_store_id, v_vente_id, id_javel, 'Eau de Javel 1L',    1,  90, 65);

end;
$$;
