# Logman PB

A production-logging app for the shop floor: workers record **worker productions** (units produced per part, process, station, and shift, with optional defects), and operators/admins review, export, and manage them. The UI is Slovak-first with an English toggle.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Auth | Better Auth (email/password) + NFC login plugin |
| Database | PostgreSQL (Supabase or self-hosted) |
| ORM | Drizzle |
| Email | Resend + React Email |
| Exports | CSV (locale-aware delimiter) |
| Styling | Tailwind CSS |
| Deployment | Vercel, or self-hosted on Ubuntu (see [Self-hosted Deployment](#self-hosted-deployment-ubuntu-2404)) |

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

- **Database** — either a local PostgreSQL (`postgresql://user:pw@127.0.0.1:5432/logman`) or Supabase (use the **Transaction-mode pooled** string, port 6543, for `DATABASE_URL`).
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
- **NFC login** — `user`-role accounts can have an `nfcKey`; scanning posts the key to `/api/auth/nfc/login`, served by a custom Better Auth plugin (`lib/auth/nfc-plugin.ts`). The plugin delegates session creation and cookie signing to Better Auth, so they stay in sync with the rest of auth. The matching client plugin (`lib/auth/client.ts`) exposes `authClient.nfc.login({ key })` and refreshes `useSession()` on success, so no page reload is needed. Errors are intentionally generic to avoid NFC key enumeration.

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

## Self-hosted Deployment (Ubuntu 24.04)

The app runs on a single Ubuntu 24.04 server with a local PostgreSQL. It is built **on the server** from a git tag; nginx sits in front and serves plain HTTP (TLS can be added later without code changes).

```
LAN ──▶ nginx :80 ──▶ next start 127.0.0.1:3000 (systemd "logman") ──▶ PostgreSQL 127.0.0.1:5432
```

Server layout:

```
/opt/logman/
  releases/0.11.0/  releases/0.12.0/   one clone + build per tag (last 3 kept)
  current -> releases/0.12.0           the active release (systemd WorkingDirectory)
  shared/.env                          config, symlinked into every release
  deploy.sh                            builds and activates a release
```

The config files used below live in [`deploy/`](deploy/). The first-time setup is done by hand, step by step, on the server.

Commands are marked 💻 (your machine) or 🖥 (the server).

### Before you start

- **Server:** Ubuntu 24.04, SSH access with a `sudo` user, at least 2 GB RAM (`next build` needs it), outbound internet (npm, GitHub, Resend).
- **Hostname:** pick the one address users will open, e.g. `logman.firma.sk`, and point it to the server's LAN IP in your internal DNS / router. **Don't use `.local`** — it is reserved for mDNS and resolves unreliably; use a subdomain of your real domain (best, also needed for TLS later) or `*.internal`. Users must always use this exact hostname: it is inlined into the client at build time and Better Auth rejects logins from any other origin.
- **PostgreSQL version:** this guide installs **PostgreSQL 18**. Importing from Supabase requires the server to run the same or a newer major version than Supabase (check with `select version();` in the Supabase SQL editor) — Supabase runs 15 or 17, so 18 is fine.
- **Resend:** API key, sender address, admin notification address.

In the commands below, replace `logman.firma.sk` with your hostname.

### First-time server setup

#### 1. Copy the config files to the server

💻
```bash
scp -r deploy <user>@<server-ip>:/tmp/logman-deploy
ssh <user>@<server-ip>
```

#### 2. Base packages and time zone

🖥
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git nginx rsync ufw unattended-upgrades postgresql-common
sudo timedatectl set-timezone Europe/Bratislava
```

Reboot afterwards if a new kernel was installed (`sudo reboot`).

#### 3. Node.js 24

🖥
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash -
sudo apt-get install -y nodejs
node --version   # v24.x
```

#### 4. PostgreSQL

Ubuntu 24.04 ships PostgreSQL 16, so install 18 from the official PostgreSQL apt repository (PGDG). The `postgresql-common` package (step 2) ships the official setup script, which adds the repository and its signing key:

🖥
```bash
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y   # writes /etc/apt/sources.list.d/pgdg.sources
sudo apt-get install -y postgresql-18

pg_lsclusters   # the 18/main cluster must be "online" on port 5432
```

PostgreSQL listens on `localhost` only by default — leave it that way.

#### 5. Database and user

🖥
```bash
openssl rand -hex 24   # copy the output — it's the DB password (hex = no URL-escaping needed)
sudo -u postgres psql
```
```sql
CREATE ROLE logman LOGIN PASSWORD '<db-password>';
CREATE DATABASE logman OWNER logman;
-- Required: timestamps are "timestamp without time zone" and written as UTC by Drizzle,
-- so defaultNow() must also be UTC (as on Supabase).
ALTER DATABASE logman SET timezone TO 'UTC';
\q
```

Check that password login over `127.0.0.1` works (this is how the app connects) and the time zone is set:

🖥
```bash
psql "postgresql://logman:<db-password>@127.0.0.1:5432/logman" -c "show timezone;"   # → UTC
```

Keep the password — it goes into `DATABASE_URL` in step 10.

#### 6. Swap (only if the server has less than 4 GB RAM)

🖥
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### 7. Firewall

> ⚠️ If SSH runs on a port other than 22, run `sudo ufw allow <port>/tcp` **first**, or you will lock yourself out.

🖥
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw enable
```

PostgreSQL (5432) and the app (3000) are deliberately not opened.

#### 8. App user, directories, deploy script

🖥
```bash
sudo adduser --system --group --shell /bin/bash --home /opt/logman logman
sudo -u logman mkdir -p /opt/logman/releases /opt/logman/shared
sudo install -o logman -g logman -m 0755 /tmp/logman-deploy/deploy.sh /opt/logman/deploy.sh

# Allow the logman user to restart its own service (used by deploy.sh) — nothing else
echo 'logman ALL=(root) NOPASSWD: /usr/bin/systemctl restart logman' | sudo tee /etc/sudoers.d/logman
sudo chmod 0440 /etc/sudoers.d/logman
sudo visudo -cf /etc/sudoers.d/logman   # must print "parsed OK"
```

#### 9. GitHub deploy key

The server clones the repo over SSH with a read-only key.

🖥
```bash
sudo -u logman mkdir -m 700 /opt/logman/.ssh
sudo -u logman ssh-keygen -t ed25519 -N "" -C "logman@$(hostname)" -f /opt/logman/.ssh/id_ed25519
sudo cat /opt/logman/.ssh/id_ed25519.pub
```

On GitHub: **qbitsk/logman-pb → Settings → Deploy keys → Add deploy key**, paste the key, leave **Allow write access unchecked**. Then test (answer `yes` to the host-key prompt):

🖥
```bash
sudo -iu logman ssh -T git@github.com   # "Hi qbitsk/logman-pb! You've successfully authenticated…"
```

#### 10. Environment file

🖥
```bash
openssl rand -base64 32   # copy the output — it's BETTER_AUTH_SECRET
sudo -u logman nano /opt/logman/shared/.env
```

```env
DATABASE_URL="postgresql://logman:<db-password>@127.0.0.1:5432/logman"
BETTER_AUTH_SECRET="<generated secret>"
BETTER_AUTH_URL="http://logman.firma.sk"
NEXT_PUBLIC_APP_URL="http://logman.firma.sk"
INTERNAL_APP_URL="http://127.0.0.1:3000"
LOG_LEVEL="info"
RESEND_API_KEY="re_..."
EMAIL_FROM="noreply@firma.sk"
ADMIN_EMAIL="admin@firma.sk"
```

🖥
```bash
sudo chmod 600 /opt/logman/shared/.env
```

- Quote every value — the file is read by bash (`deploy.sh`), systemd and Next.js.
- **Do not add `NODE_ENV`.** `deploy.sh` loads this file before `npm ci`; `NODE_ENV=production` would skip the devDependencies needed to build and migrate. The systemd unit sets it for runtime.
- `NEXT_PUBLIC_APP_URL` is inlined at build time: after changing it, deploy a new release.

#### 11. systemd service

🖥
```bash
sudo cp /tmp/logman-deploy/logman.service /etc/systemd/system/logman.service
sudo systemctl daemon-reload
sudo systemctl enable logman   # don't start yet — the first deploy starts it
```

The unit runs `next start` on `127.0.0.1:3000` as the `logman` user from `/opt/logman/current`, with `NODE_ENV=production` and `TZ=Europe/Bratislava`, and restarts it on failure and on boot.

#### 12. nginx

🖥
```bash
sed 's/__APP_HOST__/logman.firma.sk/g' /tmp/logman-deploy/nginx/logman.conf | sudo tee /etc/nginx/sites-available/logman
sudo ln -sfn /etc/nginx/sites-available/logman /etc/nginx/sites-enabled/logman
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Requests for any other host (e.g. the bare IP) are redirected to the canonical hostname.

#### 13. Backups and log size

🖥
```bash
sudo install -d -o postgres -g postgres -m 0750 /var/backups/logman
sudo install -m 0755 /tmp/logman-deploy/backup.sh /usr/local/bin/logman-backup
sudo install -m 0644 /tmp/logman-deploy/logman-backup.cron /etc/cron.d/logman-backup

sudo mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' | sudo tee /etc/systemd/journald.conf.d/logman.conf
sudo systemctl restart systemd-journald
```

Backups run nightly at 02:30 into `/var/backups/logman` and are kept for 14 days. A backup on the same server doesn't survive losing the server — set `BACKUP_RSYNC_TARGET` in `/etc/cron.d/logman-backup` (e.g. `backup@nas.local:/volume1/logman/`) and give the `postgres` user an SSH key authorized on the target.

#### 14. Import the data from Supabase

Do this **before the first deploy** — the first deploy runs `db:migrate`, and the restore fails if the tables already exist. The dump includes the `drizzle` schema, which records the applied migrations, so later migrations continue where Supabase left off.

Use Supabase's **Session pooler** connection string (Supabase → Connect → Session pooler, port 5432); the "direct" `db.*.supabase.co` host is IPv6-only.

🖥
```bash
read -rs PGPASSWORD && export PGPASSWORD   # paste the Supabase DB password, then Enter (keeps it out of shell history)
pg_dump "postgresql://postgres.<project-ref>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  --schema=public --schema=drizzle --no-owner --no-privileges -Fc -f /tmp/supabase.dump
unset PGPASSWORD

sudo -u postgres pg_restore --no-owner --role=logman -d logman /tmp/supabase.dump
```

An error `schema "public" already exists` is harmless. Errors mentioning `anon`, `authenticated` or `auth.` come from Supabase-specific policies and need a look.

Verify, then delete the dump:

🖥
```bash
sudo -u postgres psql logman -c "select count(*) from drizzle.__drizzle_migrations;"   # = number of lib/db/migrations/*.sql files
sudo -u postgres psql logman -c "select count(*) from worker_productions;"              # compare with Supabase
rm /tmp/supabase.dump
```

Users log in once on the new hostname (old cookies belong to the old domain); passwords and NFC keys carry over unchanged.

> Starting without Supabase data instead? Skip this step; the first deploy creates the tables. Then create an admin with `cd /opt/logman/current && sudo -u logman bash -c 'set -a; . /opt/logman/shared/.env; npx tsx lib/db/seed.ts'` (set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` first).

#### 15. First deploy

💻 Tag a release (tags have no `v` prefix):
```bash
npm version minor            # e.g. 0.10.0 → 0.11.0; commits and tags
git push origin main --tags
```

🖥 Deploy it:
```bash
sudo -iu logman /opt/logman/deploy.sh 0.11.0
```

It ends with `✔ 0.11.0 is live`. The first run takes a few minutes (`npm ci` + build).

#### 16. Verify

If the hostname is not in DNS yet, add it on your machine for testing: 💻 `echo "<server-ip> logman.firma.sk" | sudo tee -a /etc/hosts`.

Open `http://logman.firma.sk` and check:

- [ ] Email/password login and NFC login work; the session survives a page reload.
- [ ] A `user` opening `/admin` lands on `/unauthorized`; operators reach the pages they are allowed to.
- [ ] A new worker production shows as "new" with the correct time.
- [ ] Existing data is visible; filters and pagination work.
- [ ] CSV export downloads; the notification email arrives.
- [ ] Opening the bare server IP redirects to the hostname.
- [ ] After `sudo reboot`, the app comes back on its own.
- [ ] `sudo -u postgres logman-backup` creates a file in `/var/backups/logman`.

When done, remove the copied files: 🖥 `rm -rf /tmp/logman-deploy`.

### Deploying updates

💻
```bash
npm version patch            # or minor
git push origin main --tags
ssh -t <user>@<server-ip> 'sudo -iu logman /opt/logman/deploy.sh <tag>'
```

`deploy.sh <tag>`:

1. clones the tag into `/opt/logman/releases/<tag>` and links `shared/.env` into it,
2. runs `npm ci`, `npm run build`, `npm run db:migrate`,
3. atomically points `/opt/logman/current` at the new release and restarts the service,
4. waits until `/login` answers, then deletes all but the last 3 releases.

If anything fails before step 3, the running version is untouched and the half-built release is removed.

If a file in `deploy/` changed (service, nginx, backup), copy it to the server and apply it as in the setup steps above — `deploy.sh` only deploys the app.

### Rolling back

🖥
```bash
ls /opt/logman/releases                                  # available releases
sudo -iu logman /opt/logman/deploy.sh --activate 0.10.0
```

This switches the code only — database migrations stay applied. Keep migrations backward-compatible (add columns/tables; rename or drop them in a later release), so the previous release still works with the newer schema.

### Cutover from Vercel / Supabase

Do a trial import (step 14) and test first; Vercel stays live meanwhile. On the day, outside shift time:

1. Stop data entry on the old system.
2. 🖥 Recreate the empty database:
   ```bash
   sudo systemctl stop logman
   sudo -u postgres dropdb logman
   sudo -u postgres createdb -O logman logman
   sudo -u postgres psql -c "ALTER DATABASE logman SET timezone TO 'UTC'"
   ```
3. Repeat step 14 (dump + restore) with the current data.
4. 🖥 `sudo systemctl start logman`
5. Point terminals and bookmarks to `http://logman.firma.sk`.
6. Keep Supabase and Vercel paused (not deleted) for a few weeks before shutting them down.

### Operations

| Task | Command (🖥) |
|---|---|
| Live logs | `journalctl -u logman -f` |
| Status / restart | `systemctl status logman` / `sudo systemctl restart logman` |
| Active release | `readlink /opt/logman/current` |
| DB shell | `sudo -u postgres psql logman` |
| Backup now | `sudo -u postgres logman-backup` |
| Restore a backup | `sudo -u postgres pg_restore --clean --if-exists -d logman /var/backups/logman/<file>.dump` |
| Drizzle Studio (💻) | `ssh -L 5433:127.0.0.1:5432 <user>@<server-ip>`, then `DATABASE_URL=postgresql://logman:<db-password>@127.0.0.1:5433/logman npm run db:studio` |

Test a restore into a scratch database (`sudo -u postgres createdb logman_test`) at least once. Security updates are installed automatically by `unattended-upgrades`.

### Adding TLS later

No code changes are needed:

1. Get a certificate — certbot with a DNS-01 challenge on a real domain (works for LAN-only servers), or one from an internal CA.
2. In `/etc/nginx/sites-available/logman`, add a `listen 443 ssl` server with the same `location /` block, make the port-80 servers `return 301 https://logman.firma.sk$request_uri`, and run `sudo ufw allow 443/tcp`.
3. Change `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `/opt/logman/shared/.env` to `https://…`.
4. Deploy a new release (the URL is inlined at build time).

Better Auth then switches to `__Secure-` cookies automatically; users log in once more.
