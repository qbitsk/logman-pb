# Self-hosted deployment (Ubuntu 24.04, local PostgreSQL)

```
LAN ──▶ nginx :80 ──▶ next start 127.0.0.1:3000 (systemd "logman") ──▶ PostgreSQL 127.0.0.1:5432
```

The app is built **on the server** from a git tag into its own release directory, then activated by
swapping a symlink:

```
/srv/logman/
  releases/v0.11.0/  releases/v0.12.0/   one clone + build per tag (last 3 kept)
  current -> releases/v0.12.0            systemd WorkingDirectory
  shared/.env                            config, symlinked into every release
  deploy.sh
```

| File | Installed to |
|---|---|
| `bootstrap.sh` | run once, as root |
| `deploy.sh` | `/srv/logman/deploy.sh` |
| `logman.service` | `/etc/systemd/system/logman.service` |
| `nginx/logman.conf` | `/etc/nginx/sites-available/logman` |
| `backup.sh` | `/usr/local/bin/logman-backup` |
| `logman-backup.cron` | `/etc/cron.d/logman-backup` |

## 1. Before you start

- **Hostname.** Pick the one address users will open (e.g. `logman.firma.local`) and add an internal DNS
  record for it. It is baked into the client bundle (`NEXT_PUBLIC_APP_URL`) and Better Auth rejects
  logins from any other origin; nginx redirects other hosts (like the bare IP) to it.
- **PostgreSQL version.** Run `select version();` on Supabase. `PG_MAJOR` must be the same or newer,
  otherwise `pg_dump` / `pg_restore` refuse to work across versions.
- **RAM.** `next build` needs ~2 GB. Bootstrap adds 2 GB swap below 4 GB RAM.

## 2. Bootstrap the server (once)

```bash
scp -r deploy <server>:/tmp/logman-deploy
ssh <server>
sudo APP_HOST=logman.firma.local PG_MAJOR=17 /tmp/logman-deploy/bootstrap.sh
```

This installs Node 24, PostgreSQL (PGDG), nginx; creates the `logman` user, database (timezone `UTC`),
`/srv/logman/shared/.env` with generated DB password and auth secret, the systemd unit, nginx site,
nightly backups and a GitHub deploy key. It is safe to re-run.

Then:

1. Add the printed public key as a **read-only deploy key** on `github.com/qbitsk/logman-pb`.
2. Fill in `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` in `/srv/logman/shared/.env`.
   Keep every value quoted, and **never add `NODE_ENV`** — the file is sourced before `npm ci`.

## 3. Migrating data from Supabase

Restore into the **empty** database before the first deploy — do not run `db:migrate` first.
The `drizzle` schema carries `__drizzle_migrations`, so later migrations continue where Supabase left off.

Use Supabase's **Session pooler** connection string (port 5432); the "direct" `db.*.supabase.co` host is
IPv6-only.

```bash
# on the server
pg_dump "postgresql://postgres.xxx:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  --schema=public --schema=drizzle --no-owner --no-privileges -Fc -f /tmp/supabase.dump

sudo -u postgres pg_restore --no-owner --role=logman -d logman /tmp/supabase.dump
rm /tmp/supabase.dump
```

An error `schema "public" already exists` is harmless. Errors mentioning `anon`, `authenticated` or
`auth.` are Supabase-specific policies and need a look.

Verify:

```bash
sudo -u postgres psql logman -c "select count(*) from drizzle.__drizzle_migrations;"   # = number of files in lib/db/migrations/*.sql
sudo -u postgres psql logman -c "select count(*) from worker_productions;"              # compare with Supabase
```

Users log in once on the new hostname (old cookies belong to the old domain); passwords and NFC keys
carry over unchanged.

**Cutover:** do a trial run first and test. On the day: freeze entries on the old system, then
`sudo -u postgres dropdb logman && sudo -u postgres createdb -O logman logman`, re-run the
`ALTER DATABASE logman SET timezone TO 'UTC'` from `bootstrap.sh` (or just re-run bootstrap), dump and
restore again, `sudo systemctl restart logman`, and point terminals at the new hostname. Keep
Supabase/Vercel paused (not deleted) for a few weeks.

## 4. Deploying

```bash
# on your machine
git tag v0.11.0 && git push origin v0.11.0
ssh <server> 'sudo -iu logman /srv/logman/deploy.sh v0.11.0'
```

`deploy.sh` clones the tag, runs `npm ci`, `npm run build`, `npm run db:migrate`, swaps `current`,
restarts the service and waits for `/login` to answer. If anything fails before the swap, the live
release keeps running and the half-built directory is removed.

**Rollback** to a release that is still on disk:

```bash
ssh <server> 'sudo -iu logman /srv/logman/deploy.sh --activate v0.10.0'
```

This switches code only — migrations stay applied. Keep migrations backward-compatible (add columns
and tables; rename or drop in a later release).

## 5. Operations

| Task | Command |
|---|---|
| Logs | `journalctl -u logman -f` |
| Status / restart | `systemctl status logman` / `sudo systemctl restart logman` |
| Active release | `readlink /srv/logman/current` |
| DB shell | `sudo -u postgres psql logman` |
| Drizzle Studio from your Mac | `ssh -L 5433:127.0.0.1:5432 <server>`, then `DATABASE_URL=postgresql://logman:<pw>@127.0.0.1:5433/logman npm run db:studio` |
| Run a backup now | `sudo -u postgres logman-backup` |
| Restore a backup | `sudo -u postgres pg_restore --clean --if-exists -d logman /var/backups/logman/<file>.dump` |

Backups run nightly at 02:30 into `/var/backups/logman` (14 days kept). Set `BACKUP_RSYNC_TARGET` in
`/etc/cron.d/logman-backup` to copy them off the server — a backup on the same VPS does not survive
losing the VPS. Test a restore into a scratch database (`createdb logman_test`) at least once.

## 6. Adding TLS later

No code changes are needed:

1. Get a certificate — certbot with a DNS-01 challenge on a real domain (works for LAN-only servers),
   or one from an internal CA.
2. In `/etc/nginx/sites-available/logman`, add a `listen 443 ssl` server with the same `location /`,
   and make the port-80 servers `return 301 https://<host>$request_uri`. `sudo ufw allow 443/tcp`.
3. Change `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` in `shared/.env` to `https://…`.
4. Rebuild (the URL is inlined at build time): deploy a new tag, or remove the current release's
   directory after switching away from it and deploy it again.

Better Auth switches to `__Secure-` cookies automatically; users log in once more.
