# Logman PB

A production-logging app for the shop floor: workers record **worker productions** (units produced per part, process, station, and shift, with optional defects), and operators/admins review, export, and manage them. The UI is Slovak-first with an English toggle.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth | Better Auth (email/password) + custom NFC login |
| Database | Supabase (Postgres) |
| ORM | Drizzle |
| Email | Resend + React Email |
| Exports | CSV (locale-aware delimiter) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Project Structure

```
app/
├── (public)/login          # Login (email/password + NFC)
├── (public)/register       # Register
├── (protected)/(user)/dashboard          # User dashboard
├── (protected)/(user)/worker-productions # List / new / [id] / edit
├── (protected)/(user)/profile            # User profile
├── (protected)/admin/users               # Admin: manage users & roles
├── (protected)/admin/definitions         # Admin: processes/parts/stations/defects
├── (protected)/admin/worker-productions  # Admin/operator: review all
├── (protected)/admin/exports             # Operator+: download exports
└── api/                                  # Resource + /api/admin/* routes

lib/
├── auth/                   # Better Auth config + role/route permissions
├── db/                     # Drizzle client, schema, migrations, seed
├── exports/                # CSV generation
├── i18n/                   # Client-side locale provider + sk/en dictionaries
├── mail/                   # Resend email helpers
└── validations/            # Zod schemas

emails/                     # React Email templates
proxy.ts                    # Auth gate + role-based routing (Next 16 middleware)
```

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

- **Supabase** — create a project at [supabase.com](https://supabase.com); copy the URL, anon key, and connection strings (Settings → API / Database). Use the **Transaction-mode pooled** string (port 6543) for `DATABASE_URL` and the **Session-mode direct** string (port 5432) for `DATABASE_URL_DIRECT`.
- **Better Auth** — generate a secret with `openssl rand -base64 32`.
- **Resend** — create an account at [resend.com](https://resend.com) and get an API key.

### 3. Run database migrations

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply migrations
```

### 4. Seed an admin user

```bash
npm run db:seed       # Creates an admin (defaults: admin@example.com / Admin1234!)
```

Override with `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME`.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

Roles form a hierarchy: `admin > operator > user`.

| Role | Access |
|---|---|
| `user` | Dashboard, own worker productions, form |
| `operator` | Everything above + review all productions + exports |
| `admin` | Everything above + user management + definitions |

Public sign-up is disabled — admins create users via the admin UI / `/api/admin/users`. The `role` is a column on the `users` table; access is enforced in `proxy.ts` (route-level) and re-checked in each API handler.

## Authentication

- **Email/password** via Better Auth.
- **NFC login** — `user`-role accounts can have an `nfcKey`; scanning posts the key to `/api/auth/nfc-login`, which mints a Better Auth-compatible session cookie.

## Exports

Operators and admins can download a CSV of all worker productions (with defects) from `/api/exports?format=csv`. The field delimiter is chosen from the `Accept-Language` header (`,` for English locales, `;` for European locales so Excel/Calc parse it correctly).

## Internationalization

`lib/i18n` provides a client-side `LocaleProvider` / `useTranslation`. Default locale is **Slovak** (`sk`); the choice is stored in `localStorage`. Add or change strings in `lib/i18n/translations/{sk,en}.ts` — the `en` dictionary is the source of truth for the `Translations` type.

## Customising the Form

Worker-production fields are defined in three places that must stay in sync:

- `lib/validations/worker-production.ts` — Zod schema (validation)
- `lib/db/schema/worker-productions.ts` — Drizzle schema (DB columns)
- `components/forms/WorkerProductionForm.tsx` — UI form

After changing the schema, run `npm run db:generate && npm run db:migrate`.

## Deployment to Vercel

1. Push to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add all environment variables from `.env.example`.
4. Deploy — production builds run `db:migrate` automatically (see `vercel-build`).

> Use the **pooled** Supabase connection string (`DATABASE_URL`) for the app and the **direct** string (`DATABASE_URL_DIRECT`) only for migrations.
