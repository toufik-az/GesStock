-- GesStock — Migration 0001: Tables
-- Run in Supabase SQL Editor (Settings → SQL Editor → New query)

create extension if not exists "uuid-ossp";

-- ─── stores ────────────────────────────────────────────────────────────────
create table public.stores (
  id         uuid primary key default uuid_generate_v4(),
  nom        text not null,
  telephone  text,
  adresse    text,
  devise     text not null default 'DA',
  created_at timestamptz not null default now()
);

-- ─── profiles (mirrors auth.users 1:1) ─────────────────────────────────────
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  store_id   uuid not null references public.stores(id) on delete cascade,
  role       text not null check (role in ('gerant', 'caissier')),
  nom        text not null,
  actif      boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── categories ────────────────────────────────────────────────────────────
create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  nom        text not null,
  couleur    text not null default '#1565C0',
  created_at timestamptz not null default now()
);

-- ─── produits ──────────────────────────────────────────────────────────────
create table public.produits (
  id           uuid primary key default uuid_generate_v4(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  nom          text not null,
  code_barre   text,
  categorie_id uuid references public.categories(id) on delete set null,
  prix_achat   numeric(12,2) not null default 0,
  prix_vente   numeric(12,2) not null,
  quantite     numeric(12,3) not null default 0,
  quantite_min numeric(12,3) not null default 5,
  unite        text not null default 'Pièce',
  date_ajout   timestamptz not null default now()
);

-- Unique barcode per store; NULLs are excluded from uniqueness
create unique index produits_code_barre_store_idx
  on public.produits(store_id, code_barre)
  where code_barre is not null;

-- ─── fournisseurs ──────────────────────────────────────────────────────────
create table public.fournisseurs (
  id         uuid primary key default uuid_generate_v4(),
  store_id   uuid not null references public.stores(id) on delete cascade,
  nom        text not null,
  telephone  text not null default '',
  created_at timestamptz not null default now()
);

-- ─── ventes ────────────────────────────────────────────────────────────────
create table public.ventes (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  caissier_id    uuid not null references public.profiles(id),
  date_heure     timestamptz not null default now(),
  total          numeric(12,2) not null,
  montant_recu   numeric(12,2) not null default 0,
  monnaie_rendue numeric(12,2) not null default 0
);

-- ─── lignes_vente ──────────────────────────────────────────────────────────
-- prix_achat is snapshotted at sale time for accurate historical margin
create table public.lignes_vente (
  id            uuid primary key default uuid_generate_v4(),
  store_id      uuid not null references public.stores(id) on delete cascade,
  vente_id      uuid not null references public.ventes(id) on delete cascade,
  produit_id    uuid references public.produits(id) on delete set null,
  nom_produit   text not null,
  quantite      numeric(12,3) not null,
  prix_unitaire numeric(12,2) not null,
  prix_achat    numeric(12,2) not null default 0
);

-- ─── receptions ────────────────────────────────────────────────────────────
create table public.receptions (
  id             uuid primary key default uuid_generate_v4(),
  store_id       uuid not null references public.stores(id) on delete cascade,
  fournisseur_id uuid references public.fournisseurs(id) on delete set null,
  date_heure     timestamptz not null default now()
);

-- ─── lignes_reception ──────────────────────────────────────────────────────
create table public.lignes_reception (
  id           uuid primary key default uuid_generate_v4(),
  store_id     uuid not null references public.stores(id) on delete cascade,
  reception_id uuid not null references public.receptions(id) on delete cascade,
  produit_id   uuid not null references public.produits(id) on delete restrict,
  quantite     numeric(12,3) not null,
  prix_achat   numeric(12,2)
);
