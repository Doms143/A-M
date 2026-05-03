# A&M Online Grocery Store

React + Vercel Python starter template for an online grocery ordering storefront.

## Project profile

- Project Name: A&M Online Grocery Store
- Main Features: Ordering System, Admin Product Management
- Target Audience: Neighborhood customers ordering daily essentials
- Technologies: React, JavaScript, Python, Supabase, Vercel

## Architecture

The template is split by feature to keep the storefront and API modular:

- `src/features/admin`: admin product form and recent database orders
- `src/features/catalog`: product listing and filtering
- `src/features/cart`: cart state and quantity controls
- `src/features/checkout`: checkout form and order submission
- `api/features/admin`: admin endpoints for products and recent orders
- `api/features/catalog`: catalog routes for the backend slice
- `api/features/orders`: order routes, persistence, and order-building logic
- `api/features/checkout`: checkout endpoint slice
- `api/_lib`: shared backend infrastructure only
- `api/index.py`: thin app composition layer that registers slice blueprints
- `supabase/schema.sql`: products, orders, and policies
- `supabase/admin_queries.sql`: quick admin queries for admin accounts, products, and recent orders

## Local setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and fill in real Supabase keys.
Admin access depends on `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and rows in `public.admin_accounts`.

4. Apply `supabase/schema.sql` in your Supabase SQL editor.
This creates the `products` and `orders` tables and seeds the starter catalog.

5. Optional: use `supabase/admin_queries.sql` for quick selects and example product upserts.

6. Run the frontend:

```bash
npm run dev
```

7. Run the backend locally:

```bash
py -m flask --app api.index:app --debug run --host 127.0.0.1 --port 5000
```

8. For a single Vercel-like local runtime, use:

```bash
npx vercel dev
```

## Deployment notes

- Vercel will build the React app from the root `package.json`.
- Python endpoints are exposed from `api/index.py`.
- The storefront is the root route `#/`, and the admin view is `#/admin`.
- The storefront button is for admin access. Admin sign-in uses Supabase email/password.
- Admin API routes are protected by the `public.admin_accounts` table.
- Recent orders are shown only in the admin view, not on the storefront.
- Order tokens are validated against Supabase Auth on the backend instead of being decoded locally.
- Replace the checkout stub in `/api/checkout` with your payment provider flow.
- Avoid exposing the Supabase service role key in the browser. It is used only by the Python API.
