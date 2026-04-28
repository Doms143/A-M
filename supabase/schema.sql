create table if not exists public.orders (
  id uuid primary key,
  user_id uuid null,
  guest_name text not null,
  villa_number text not null,
  delivery_window text not null,
  notes text null,
  status text not null default 'pending',
  total numeric(10, 2) not null,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
on public.orders
for select
using (auth.uid() = user_id);

create policy "Service role can insert orders"
on public.orders
for insert
with check (true);
