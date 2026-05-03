create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  name text not null,
  description text not null,
  category text not null,
  price numeric(10, 2) not null,
  pricing_unit text not null default 'piece',
  is_active boolean not null default true,
  stock_quantity integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.products add column if not exists pricing_unit text not null default 'piece';
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.products drop constraint if exists products_pricing_unit_check;
alter table public.products
add constraint products_pricing_unit_check
check (pricing_unit in ('piece', 'kilogram'));
alter table public.products drop constraint if exists products_stock_quantity_check;
alter table public.products
add constraint products_stock_quantity_check
check (stock_quantity >= 0);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_active_idx on public.products (is_active);
create index if not exists products_stock_quantity_idx on public.products (stock_quantity);

create table if not exists public.admin_accounts (
  email text primary key,
  display_name text null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.admin_accounts add column if not exists display_name text null;
alter table public.admin_accounts add column if not exists is_active boolean not null default true;
alter table public.admin_accounts add column if not exists created_at timestamptz not null default timezone('utc', now());
create index if not exists admin_accounts_active_idx on public.admin_accounts (is_active);

insert into public.products (id, name, description, category, price, pricing_unit, is_active, stock_quantity)
values
  ('instant-noodles', 'Instant Noodles', 'Quick merienda staple for an online grocery shelf.', 'refreshments', 18.00, 'piece', true, 24),
  ('3in1-coffee', '3-in-1 Coffee Pack', 'Convenient single-serve coffee sachets for daily use.', 'housekeeping', 12.00, 'piece', true, 30),
  ('canned-sardines', 'Canned Sardines', 'Affordable pantry essential commonly stocked in online grocery stores.', 'wellness', 28.00, 'piece', true, 18),
  ('bottled-water', 'Bottled Water', 'Everyday drinking water for quick neighborhood purchases.', 'refreshments', 15.00, 'piece', true, 36)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  pricing_unit = excluded.pricing_unit,
  is_active = excluded.is_active,
  stock_quantity = excluded.stock_quantity;

create table if not exists public.orders (
  id uuid primary key,
  reference_code text null unique,
  user_id uuid null,
  guest_name text not null,
  contact_email text null,
  mobile_number text null,
  villa_number text not null,
  delivery_window text not null,
  notes text null,
  status text not null default 'pending',
  subtotal numeric(10, 2) not null default 0,
  total numeric(10, 2) not null,
  items jsonb not null default '[]'::jsonb,
  status_history jsonb not null default '[]'::jsonb,
  status_updated_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.orders add column if not exists contact_email text null;
alter table public.orders add column if not exists mobile_number text null;
alter table public.orders add column if not exists subtotal numeric(10, 2) not null default 0;
alter table public.orders add column if not exists reference_code text null;
alter table public.orders add column if not exists status_history jsonb not null default '[]'::jsonb;
alter table public.orders add column if not exists status_updated_at timestamptz null;
create unique index if not exists orders_reference_code_key on public.orders (reference_code) where reference_code is not null;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
add constraint orders_status_check
check (status in ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'));

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_reference_code_idx on public.orders (reference_code);
create index if not exists orders_status_updated_at_idx on public.orders (status_updated_at desc);

alter table public.admin_accounts enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;

drop policy if exists "Admins can view admin accounts" on public.admin_accounts;
create policy "Admins can view admin accounts"
on public.admin_accounts
for select
using (false);

drop policy if exists "Anyone can view active products" on public.products;
create policy "Anyone can view active products"
on public.products
for select
using (is_active = true);

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
on public.orders
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their own orders" on public.orders;
create policy "Users can create their own orders"
on public.orders
for insert
to authenticated
with check (auth.uid() = user_id);
