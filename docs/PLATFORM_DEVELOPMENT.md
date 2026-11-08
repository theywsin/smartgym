# SmartGym 2.0: local development

The new platform lives in the npm workspaces `apps/*` and `packages/*`, next to the legacy prototype (`src/`, `server/`), which keeps working unchanged.

| Workspace | What it is |
|---|---|
| `packages/shared` | Pure helpers: Persian/Latin digits, Iranian mobile numbers, money (bigint rial), the permission catalogue and roles |
| `packages/validation` | Zod schemas shared by the API and the forms |
| `packages/db` | Prisma schema, migrations (including row-level security), `withTenant` / `withUser` / `withSystem`, seed |
| `packages/core` | Business logic: OTP, sessions, RBAC, gyms, branches, staff, audit, SMS providers |
| `apps/web` | Next.js app: manager panel and the `/api/v1` routes |
| `apps/worker` | Background jobs: membership expiry SMS reminders, expiring payment links |

## Quick start (one command)

```bash
./scripts/dev-setup.sh          # starts Postgres in Docker (port 5433), writes apps/web/.env.local, migrates, seeds, runs the app
./scripts/dev-setup.sh --reset  # same, after wiping the local dev database
```

Open http://localhost:3001 and sign in with `09120000001`; the OTP code is printed in the terminal.
On Windows use WSL, or follow the manual steps below.

## 1. Services

```bash
docker compose -f docker/compose.dev.yml up -d   # Postgres 16
```

The compose file creates two database roles:

- `smartgym_owner` owns the schema. Use it only for migrations and the seed.
- `smartgym_app` is the runtime role. It does not own the tables, so Postgres row-level security applies to every query the app makes. Never run the app as the owner.

## 2. Install, migrate, seed

```bash
npm install
export MIGRATION_DATABASE_URL="postgresql://smartgym_owner:owner@localhost:5433/smartgym"
export DATABASE_URL="postgresql://smartgym_app:app@localhost:5433/smartgym"
npm run migrate:deploy -w @smartgym/db
npm run seed -w @smartgym/db                 # permissions, roles, modules, plans
SEED_DEV=true npm run seed -w @smartgym/db   # plus two demo gyms (development only)
```

`SEED_DEV` must never be set in production. The base seed is safe to re-run.

## 3. Run the web app

```bash
cp apps/web/.env.example apps/web/.env.local   # then fill in the secrets
npm run dev -w @smartgym/web
```

SMS providers: `console` (development), `melipayamak` (production: set `MELIPAYAMAK_API_KEY` and `MELIPAYAMAK_OTP_BODY_ID`, the id of an approved shared-line template whose text contains `{0}` for the code), and `kavenegar`.

With `SMS_PROVIDER=console` the OTP code is printed in the server log. The console provider refuses to start in production unless `ALLOW_CONSOLE_SMS=true`, which is only for local `next start` testing.

Demo owners after `SEED_DEV`: `09120000001` (demo-arian) and `09120000002` (demo-negin).

## 3b. Run the worker

```bash
DATABASE_URL=... SMS_PROVIDER=console npm start -w @smartgym/worker   # loop, every 15 minutes
npm run once -w @smartgym/worker                                     # single pass (cron / systemd timer)
```

Reminders are sent only between 09:00 and 21:00 Tehran time, once per sold period (claimed in `notification_log` before sending, so two workers never double-send). They need an approved template: `MELIPAYAMAK_EXPIRY_BODY_ID` (text with `{0}` first name, `{1}` gym name, `{2}` days left). Without it the job logs that it skipped.

## 4. Checks (same as CI)

```bash
npm run typecheck:platform
DATABASE_URL=... npm run test:platform   # DB tests are skipped when DATABASE_URL is unset
npm run build -w @smartgym/web
npm run lint && npm test && npm run build   # legacy prototype
```

## Money

All amounts are stored as `BigInt` **rial**. Convert at the edges with `tomanToRial` / `formatToman` from `@smartgym/shared`.

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) (AlmaLinux VPS, Docker Compose, Nginx, HTTPS, backups).
