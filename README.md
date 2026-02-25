# Kone The Lay Myar Digital (KTLM Digital)

P2P marketplace for digital goods and game top-ups. Next.js (App Router) + TypeScript + MongoDB + JWT auth.

---

## Tech Stack

| Layer    | Technology                                    |
| -------- | --------------------------------------------- |
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling  | Tailwind CSS (dark theme)                     |
| Database | MongoDB (Mongoose)                            |
| Auth     | JWT in HTTP-only cookie (jose)                |
| Hosting  | Any Node host (Vercel, Railway, etc.)         |

---

## Project Structure

```
konethelaymyar-digital/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home
│   ├── login/               # Login / Sign up page
│   ├── profile/             # User profile (role-based buttons)
│   ├── admin/               # Admin panel (role === 'admin')
│   │   ├── layout.tsx       # requireAdmin()
│   │   ├── page.tsx        # Dashboard, products, users, orders
│   │   └── orders/[id]/     # Order detail + status change
│   ├── seller/              # Seller dashboard (role === 'seller' | 'admin')
│   │   ├── layout.tsx      # requireSeller()
│   │   ├── page.tsx        # My products CRUD
│   │   └── apply/          # Become a Seller (buyer → seller)
│   └── api/                 # API routes
│       ├── auth/            # login, signup, logout, session
│       ├── profile/role/    # PATCH role (e.g. become seller)
│       ├── seller/products/ # Seller product CRUD
│       ├── admin/           # Admin: products, users, orders
│       └── orders/          # List / create orders
├── lib/
│   ├── config.ts            # Central env config (DB, JWT, base path)
│   ├── auth.ts              # Session, getSession, requireAdmin, requireSeller
│   ├── db.ts                # connectDB() (MongoDB)
│   └── models/              # Mongoose: User, Product, Order, Wallet
├── middleware.ts            # Route protection: /admin, /seller
├── .env.local               # Secrets (never commit)
├── .env.example             # Required env vars template
└── README.md                # This file
```

### Folder Roles

- **app/** – Next.js App Router: pages and API routes. Route protection is done in `layout.tsx` (requireAdmin / requireSeller) and in **middleware.ts** (redirect by role).
- **lib/** – Shared logic: config, auth, DB connection, models. No `process.env` outside `lib/config.ts`.
- **middleware.ts** – Runs on every request matched by `config.matcher`; checks JWT and role for `/admin` and `/seller`.

---

## Setup (New Developer / New Environment)

### 1. Clone and install

```bash
git clone <repo-url>
cd konethelaymyar-digital
npm install
```

### 2. Environment variables

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

| Variable                | Required   | Description                                                             |
| ----------------------- | ---------- | ----------------------------------------------------------------------- |
| `MONGODB_URI`           | Yes        | MongoDB connection string (e.g. Atlas URI).                             |
| `JWT_SECRET`            | Yes (prod) | Long random string for signing sessions. e.g. `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_PATH` | No         | Set only if app is served under a subpath (e.g. `/myapp`).              |

Do **not** commit `.env.local`. Use `.env.example` as the checklist for required variables.

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up creates a user with `role: 'buyer'`. Use Profile to see role-based actions (Become a Seller, Seller Dashboard, Admin Panel).

### 4. Build for production

```bash
npm run build
npm start
```

Ensure `MONGODB_URI` and `JWT_SECRET` are set in your hosting environment (e.g. Vercel → Settings → Environment Variables).

---

## Configuration (DB / Host Change)

- All environment-dependent values are read from **`lib/config.ts`**.
- Do **not** hardcode MongoDB URI, API keys, or domain names anywhere else.
- To switch database or host: change `.env.local` (or hosting env) and redeploy. No code change needed if the same env var names are used.

---

## User Roles

| Role   | Description                                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| buyer  | Default for new signups. Can place orders; can apply to become seller.                   |
| seller | Can list products and manage their own products at `/seller`.                            |
| admin  | Full access to `/admin`: all products, users, orders; can change roles and order status. |

Role is stored in the **User** model and in the **JWT** session payload. Middleware and layouts enforce access to `/admin` and `/seller`.

---

## API Overview

- **Auth:** `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `GET /api/auth/session`
- **Profile:** `PATCH /api/profile/role` (body: `{ role: "seller" }` for buyer → seller)
- **Seller:** `GET/POST /api/seller/products`, `GET/PATCH/DELETE /api/seller/products/[id]`
- **Admin:** `GET /api/admin/products`, `GET/PATCH/DELETE /api/admin/products/[id]`, `GET /api/admin/users`, `PATCH /api/admin/users/[id]`, `PATCH /api/admin/orders/[id]`
- **Orders:** `GET/POST /api/orders`

All authenticated routes use `getSession()`; role checks return 403 when not allowed.

---

## Scripts

| Command         | Description      |
| --------------- | ---------------- |
| `npm run dev`   | Start dev server |
| `npm run build` | Production build |
| `npm start`     | Run production   |
| `npm run lint`  | Run ESLint       |

---

## Further Documentation

- **Master_Architecture.md** – High-level product vision, phases, and (reference) schema.
- **.env.example** – List of required and optional environment variables.
