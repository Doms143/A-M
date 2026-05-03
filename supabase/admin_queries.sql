select
  email,
  display_name,
  is_active,
  created_at
from public.admin_accounts
order by created_at desc;

select
  email,
  display_name,
  is_active,
  created_at
from public.admin_accounts
where email = 'admin@example.com'
limit 1;

insert into public.admin_accounts (email, display_name, is_active)
values (
  'admin@example.com',
  'Default Admin',
  true
)
on conflict (email) do update
set
  display_name = excluded.display_name,
  is_active = excluded.is_active;

update public.admin_accounts
set
  display_name = 'Updated Admin Name',
  is_active = true
where email = 'admin@example.com';

update public.admin_accounts
set is_active = false
where email = 'admin@example.com';

select
  id,
  reference_code,
  guest_name as customer_name,
  mobile_number,
  villa_number as address_note,
  delivery_window,
  status,
  status_updated_at,
  status_history,
  total,
  created_at
from public.orders
order by created_at desc
limit 50;

select
  id,
  name,
  category,
  price,
  is_active,
  stock_quantity,
  created_at
from public.products
order by created_at desc;

insert into public.products (id, name, description, category, price, is_active, stock_quantity)
values (
  'soy-sauce-sachet',
  'Soy Sauce Sachet',
  'Small daily-use condiment item for an online grocery store.',
  'refreshments',
  2.50,
  true,
  25
)
on conflict (id) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  is_active = excluded.is_active,
  stock_quantity = excluded.stock_quantity;
