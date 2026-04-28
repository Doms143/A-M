# Goods Ordering Website

React + Vercel Python starter template for a resort goods ordering storefront.

## Project profile

- Project Name: Goods Ordering Website
- Main Features: Ordering System
- Target Audience: Resort ordering goods, age 20-40
- Technologies: React, JavaScript, Python, Supabase, Vercel

## Architecture

The template is split by feature to keep the storefront and API modular:

- `src/features/auth`: Supabase session handling
- `src/features/catalog`: product listing and filtering
- `src/features/cart`: cart state and quantity controls
- `src/features/checkout`: checkout form and order submission
- `src/features/orders`: order history
- `api/`: Vercel-ready Python functions and supporting modules
- `supabase/schema.sql`: starter table and policies

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

4. Apply `supabase/schema.sql` in your Supabase SQL editor.

5. Run the frontend:

```bash
npm run dev
```

6. Run the backend locally with Vercel:

```bash
vercel dev
```

## Deployment notes

- Vercel will build the React app from the root `package.json`.
- Python endpoints are exposed from `api/index.py`.
- Replace the checkout stub in `/api/checkout` with your payment provider flow.
- Avoid exposing the Supabase service role key in the browser. It is used only by the Python API.
