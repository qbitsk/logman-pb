# Logman PB

A full-stack Next.js application with authentication, role-based access control, data submissions, exports, and email notifications.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Better Auth |
| Database | Supabase (Postgres) |
| ORM | Drizzle |
| Email | Resend + React Email |
| Exports | ExcelJS (xlsx + csv) |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## Project Structure

```
app/
├── (public)/login        # Login page
├── (public)/register     # Register page
├── (user)/dashboard      # User dashboard
├── (user)/submissions    # Submissions list + new form
├── (admin)/users         # Admin: manage user roles
├── (admin)/exports       # Admin: download exports
└── api/                  # All API routes

lib/
├── auth/                 # Better Auth config + permissions map
├── db/                   # Drizzle client + schema
├── exports/              # CSV + Excel generation
├── mail/                 # Resend email helpers
└── validations/          # Zod schemas

emails/                   # React Email templates
middleware.ts             # Auth gate + role-based routing
```

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd my-app
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

- **Supabase**: Create a project at [supabase.com](https://supabase.com), then copy the URL, anon key, and database connection strings from Settings → API and Settings → Database.
- **Better Auth**: Generate a secret with `openssl rand -base64 32`
- **Resend**: Create an account at [resend.com](https://resend.com) and get an API key.

### 3. Run database migrations

```bash
npm run db:generate   # Generate SQL from schema
npm run db:migrate    # Apply migrations to Supabase
```

### 4. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## User Roles

| Role | Access |
|---|---|
| `user` | Dashboard, own submissions, form |
| `editor` | Everything above + data exports |
| `admin` | Everything above + user management |

The first registered user will have the `user` role. To make yourself an admin, update the `role` column in your Supabase table directly (or build a seed script).

## Deployment to Vercel

1. Push your code to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy — Vercel auto-deploys on every push to `main`

> Use the **pooled** Supabase connection string (`DATABASE_URL`) for the app and the **direct** string (`DATABASE_URL_DIRECT`) only for migrations.

## Email Setup (Resend)

1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key and add it to `RESEND_API_KEY`
4. Update `EMAIL_FROM` to use your verified domain
5. Update `ADMIN_EMAIL` in `/app/api/submissions/route.ts` or add it as an env var

## Customising the Form

The submission form fields are defined in:
- `lib/validations/submission.ts` — Zod schema (validation rules)
- `lib/db/schema/submissions.ts` — Drizzle schema (database columns)
- `components/forms/SubmissionForm.tsx` — UI form component

After changing the schema, run `npm run db:generate && npm run db:migrate` to apply changes.
