-- Execute no SQL Editor do Supabase. Esta versão usa apenas o backend local.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category text not null check (char_length(btrim(category)) between 1 and 80),
  quantity integer not null default 0 check (quantity >= 0),
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_products_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_products_updated_at();

create index if not exists products_name_idx on public.products (name);
create index if not exists products_category_idx on public.products (category);

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated, service_role;
revoke all on function public.set_products_updated_at() from public, anon, authenticated, service_role;
grant select, insert, update, delete on public.products to service_role;

-- A secret key do Supabase usa service_role, que contorna RLS.
-- Nenhuma policy pública é criada; anon e authenticated não recebem acesso.
