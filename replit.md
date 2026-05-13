# Tasty Point

A full-stack restaurant QR ordering web app — customers scan a table QR code, browse the menu, place orders, and pay via Razorpay. Admins manage the menu, tables, and orders through a protected dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/tasty-point run dev` — run the React frontend (proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (tables: categories, menu_items, restaurant_tables, orders)
- Auth: Supabase (admin only — email/password)
- Payments: Razorpay (server-side order creation + client-side checkout.js)
- Image uploads: Cloudinary (server-side signed uploads)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/tasty-point/src/` — React frontend
  - `pages/` — LandingPage, MenuPage, OrderTrackingPage, OrderSuccessPage
  - `pages/admin/` — AdminLoginPage, AdminLayout, AdminDashboard, AdminOrdersPage, AdminMenuPage, AdminTablesPage
  - `components/` — Navbar, MenuItemCard, CartDrawer, AdminSidebar, ImageUpload, OrderStatusBadge, LoadingSpinner
  - `contexts/` — CartContext (localStorage), AdminAuthContext (Supabase)
  - `lib/supabase.ts` — Supabase client (admin auth only)
- `artifacts/api-server/src/routes/` — Express routes: menu, tables, orders, payments, uploads, admin, health
- `lib/db/src/schema.ts` — Drizzle ORM schema (source of truth)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for codegen)
- `lib/api-client-react/src/generated/` — Generated React Query hooks

## Architecture decisions

- Supabase is used **only** for admin authentication — all restaurant data (menu, orders, tables) lives in Replit PostgreSQL via Drizzle ORM.
- QR codes are simply URL paths (`/menu?tableId=<uuid>`) stored in the DB. Scan → redirect to menu.
- Cart state is persisted in `localStorage`; no server-side cart session.
- Razorpay: server creates order (HMAC signed), client opens checkout.js, server verifies signature before marking payment as paid.
- Cloudinary: server generates upload signature, client uploads directly to Cloudinary CDN.

## Product

- **Customer flow**: Scan QR → browse menu by category → add to cart → place order → track live status → pay via Razorpay
- **Admin flow**: Login (Supabase) → dashboard stats → manage orders (status updates) → manage menu (categories + items with images) → manage tables (QR URL generation)

## User preferences

- Red/white theme (`--primary: 0 85% 45%`), mobile-first layout
- Indian restaurant context (₹ currency, Indian dishes as seed data)
- React + Vite (not Next.js)

## Gotchas

- After changing DB schema: run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs` to rebuild lib declarations
- After changing openapi.yaml: run `pnpm --filter @workspace/api-spec run codegen`
- The API routes are all prefixed with `/api` by the reverse proxy — Express handles full paths like `/api/menu/categories`
- Admin users must be created in Supabase dashboard (Authentication → Users)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
