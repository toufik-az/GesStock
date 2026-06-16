-- GesStock — Migration 0002: Security helpers + RLS
-- Run AFTER 0001_init.sql

-- ─── Helper functions (SECURITY DEFINER) ───────────────────────────────────
-- These are called inside RLS policies to avoid per-row subquery overhead.

create or replace function public.auth_store_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select store_id from public.profiles where id = auth.uid() limit 1
$$;

create or replace function public.auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1
$$;

-- ─── Enable RLS ────────────────────────────────────────────────────────────
alter table public.stores          enable row level security;
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.produits        enable row level security;
alter table public.fournisseurs    enable row level security;
alter table public.ventes          enable row level security;
alter table public.lignes_vente    enable row level security;
alter table public.receptions      enable row level security;
alter table public.lignes_reception enable row level security;

-- ─── stores ────────────────────────────────────────────────────────────────
create policy "stores_own"
  on public.stores for all
  using (id = public.auth_store_id());

-- ─── profiles ──────────────────────────────────────────────────────────────
create policy "profiles_read"
  on public.profiles for select
  using (store_id = public.auth_store_id());

create policy "profiles_gerant_insert"
  on public.profiles for insert
  with check (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "profiles_gerant_update"
  on public.profiles for update
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "profiles_gerant_delete"
  on public.profiles for delete
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant' and id <> auth.uid());

-- ─── categories ────────────────────────────────────────────────────────────
create policy "categories_read"
  on public.categories for select
  using (store_id = public.auth_store_id());

create policy "categories_gerant_insert"
  on public.categories for insert
  with check (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "categories_gerant_update"
  on public.categories for update
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "categories_gerant_delete"
  on public.categories for delete
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

-- ─── produits ──────────────────────────────────────────────────────────────
create policy "produits_read"
  on public.produits for select
  using (store_id = public.auth_store_id());

create policy "produits_gerant_insert"
  on public.produits for insert
  with check (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "produits_gerant_update"
  on public.produits for update
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "produits_gerant_delete"
  on public.produits for delete
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

-- ─── fournisseurs ──────────────────────────────────────────────────────────
create policy "fournisseurs_gerant"
  on public.fournisseurs for all
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

-- ─── ventes ────────────────────────────────────────────────────────────────
-- Gérant sees all ventes; caissier sees only their own.
-- Inserts go through the enregistrer_vente RPC (SECURITY DEFINER) — no direct INSERT needed.
create policy "ventes_gerant_all"
  on public.ventes for select
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "ventes_caissier_own"
  on public.ventes for select
  using (store_id = public.auth_store_id() and caissier_id = auth.uid());

-- ─── lignes_vente ──────────────────────────────────────────────────────────
create policy "lignes_vente_read"
  on public.lignes_vente for select
  using (store_id = public.auth_store_id());

-- ─── receptions ────────────────────────────────────────────────────────────
create policy "receptions_gerant"
  on public.receptions for all
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');

create policy "lignes_reception_gerant"
  on public.lignes_reception for all
  using (store_id = public.auth_store_id() and public.auth_role() = 'gerant');
