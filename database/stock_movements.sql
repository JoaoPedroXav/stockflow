-- Execute no SQL Editor do projeto StockFlow existente.
-- Cada chamada da função atualiza o saldo e grava o histórico na mesma transação.

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  movement_type text not null check (movement_type in ('in', 'out')),
  quantity integer not null check (quantity > 0),
  quantity_before integer not null check (quantity_before >= 0),
  quantity_after integer not null check (quantity_after >= 0),
  reason text not null check (char_length(btrim(reason)) between 1 and 240),
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_created_at_idx
  on public.stock_movements (created_at desc);
create index if not exists stock_movements_product_id_idx
  on public.stock_movements (product_id);

alter table public.stock_movements enable row level security;
revoke all on public.stock_movements from public, anon, authenticated, service_role;
grant select, insert on public.stock_movements to service_role;

create or replace function public.register_stock_movement(
  p_product_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reason text
)
returns public.stock_movements
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_after bigint;
  v_movement public.stock_movements%rowtype;
begin
  if p_movement_type is null or p_movement_type not in ('in', 'out') then
    raise exception 'Tipo de movimentação inválido.' using errcode = '22023';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'A quantidade deve ser maior que zero.' using errcode = '22023';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) not between 1 and 240 then
    raise exception 'Informe um motivo com até 240 caracteres.' using errcode = '22023';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Produto não encontrado.' using errcode = 'P0002';
  end if;

  if p_movement_type = 'in' then
    v_after := v_product.quantity::bigint + p_quantity;
  else
    v_after := v_product.quantity::bigint - p_quantity;
  end if;

  if v_after < 0 then
    raise exception 'Quantidade insuficiente para esta saída.' using errcode = '22023';
  end if;
  if v_after > 2147483647 then
    raise exception 'O saldo ultrapassaria o limite permitido.' using errcode = '22003';
  end if;

  update public.products
  set quantity = v_after::integer
  where id = p_product_id;

  insert into public.stock_movements (
    product_id, product_name, movement_type, quantity,
    quantity_before, quantity_after, reason
  ) values (
    v_product.id, v_product.name, p_movement_type, p_quantity,
    v_product.quantity, v_after::integer, btrim(p_reason)
  ) returning * into v_movement;

  return v_movement;
end;
$$;

revoke all on function public.register_stock_movement(uuid, text, integer, text)
  from public, anon, authenticated, service_role;
grant execute on function public.register_stock_movement(uuid, text, integer, text)
  to service_role;
