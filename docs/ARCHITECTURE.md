# SmartGym 2.0 — Architecture

Status: **Proposed** (Phase 1). Decisions marked *ADR* are explained inline; each can be revisited, but changes should be recorded here.

---

## 1. Context

The audit (`PROJECT_AUDIT.md`) found a Vite + React SPA prototype with a generic, unauthenticated Express CRUD layer over a 15-table MySQL schema without relations. The brief asks for a multi-tenant SaaS with web dashboards for four audiences, a native Android-first mobile app, background jobs, payments, SMS, and AI.

## 2. Key decisions

### ADR-1 — Build alongside, not on top of, the prototype

The prototype's server and data model must be replaced, not extended: every endpoint needs auth, every table needs a tenant key and relations, every password needs re-hashing. The UI is also being redesigned (SmartGym 2.0 design board). Incremental patching would touch every line while keeping a design we are discarding.

**Decision:** new code lives in `apps/` and `packages/`. The prototype stays runnable in place until Phase 8, then moves to `legacy/` (and is later deleted with owner approval). Only an emergency security hotfix (roadmap Phase 0) is applied to the prototype.

### ADR-2 — Next.js for the web, one backend codebase

- Web: **Next.js (App Router) + React + TypeScript + Tailwind + shadcn/ui**, as the brief prefers. Server components give fast first loads for dashboards and let us keep tokens out of the browser.
- API: **Next.js Route Handlers under `/api/*`** acting as a thin HTTP layer over a framework-independent **domain package** (`packages/core`). The mobile app and the web app call the same REST API.
- Background work: one **worker process** (`apps/worker`) that imports the same `packages/core` and consumes **BullMQ** queues on Redis.

*Why not NestJS?* A separate API service is justified when the API must scale or deploy independently of the web. At launch both run on one VPS; keeping one deployable (plus the worker) halves the operational surface. Because the domain logic is in `packages/core`, extracting a standalone API later is a mechanical change.

*Why not keep Express + Vite?* Keeping them is possible, but the frontend is being rewritten anyway and the brief prefers Next.js; the Express server contains nothing reusable beyond the AI prompts.

### ADR-3 — PostgreSQL + Prisma, tenant isolation enforced twice

- **PostgreSQL 16** with **Prisma** migrations (replaces MySQL; there is no relational schema worth preserving, and Postgres gives row-level security).
- Isolation layer 1 (application): every request resolves a `TenantContext` (`gymId`, `branchIds`, `userId`, `permissions`) **from the session, never from the request body**. Core services receive the context, filter every tenant-owned query by `ctx.gymId` explicitly, and run inside `withTenant(db, ctx, fn)`, which opens a transaction and sets the `app.gym_id` / `app.user_id` settings that layer 2 (RLS) checks. A service that forgets the explicit filter still cannot read another gym's rows, because RLS rejects them. (An earlier draft proposed a Prisma client extension that injects `gymId`; explicit filters plus RLS proved simpler and easier to review.)
- Isolation layer 2 (database): **Postgres Row-Level Security** on tenant-owned tables using `current_setting('app.gym_id')`, set with `SET LOCAL` inside each request transaction. The app connects as a non-owner role so RLS cannot be bypassed; migrations run as the owner role. Super admin cross-tenant access uses a separate code path that sets `app.bypass_rls` **and writes an `AuditLog` row**.
- Integration tests prove that tenant A cannot read or write tenant B through every endpoint (see roadmap QA).

### ADR-4 — Money as integer rial

All monetary columns are `BigInt` **in Iranian rial (IRR)**, named `…AmountRial`. UI shows toman (rial ÷ 10) through one formatter in `packages/shared`. No floats anywhere in money paths. A `currency` column (default `IRR`) on `Payment`/`Transaction` keeps the door open for the planned currency redenomination.

### ADR-5 — Sessions: cookies for web, rotating refresh tokens for mobile

- Web: opaque session id in an `HttpOnly; Secure; SameSite=Lax` cookie, backed by the `Session` table (revocable, listable as "devices"). Mutating requests carry a CSRF token (double-submit). Nothing auth-related in `localStorage`.
- Mobile: short-lived JWT access token (15 min) + opaque refresh token (30 days) stored in Expo SecureStore. Refresh tokens rotate on every use; reuse of an old token revokes the whole family.
- Passwords (optional per gym): **argon2id**. Primary login is phone + OTP.

### ADR-6 — Providers behind interfaces

SMS (`SmsProvider`: Kavenegar, Melipayamak, console-sandbox), payments (`PaymentGateway`: Zarinpal, SEP, sandbox), AI (`AiProvider`: Gemini, OpenAI-compatible, Anthropic, local), storage (`ObjectStorage`: S3-compatible such as ArvanCloud/MinIO), push (`PushProvider`: Expo/FCM). Concrete providers are chosen by environment variables; sandbox adapters exist so development and E2E tests never call real services. Credentials live only in server env.

### ADR-7 — Monorepo with pnpm workspaces + Turborepo

Shared types, Zod schemas and an API client between web and mobile are the main reason. No microservices.

## 3. Repository layout (target)

```
smartgym/
├── apps/
│   ├── web/                 Next.js: (public), (auth), manager/, coach/, athlete/, super-admin/, api/
│   ├── worker/              BullMQ consumers + cron schedules
│   └── mobile/              Expo (React Native) athlete app — Android first
├── packages/
│   ├── core/                domain modules (services, repositories, policies) — no HTTP, no React
│   ├── db/                  Prisma schema, migrations, client + withTenant/withUser/withSystem helpers, seed
│   ├── validation/          Zod schemas (request/response contracts)
│   ├── shared/              money/date (Jalali)/phone/number helpers, constants, permission catalogue
│   ├── api-client/          typed fetch client generated from OpenAPI, used by web + mobile
│   └── ui/                  design tokens + shadcn-based components (web)
├── docker/                  Dockerfiles, compose for local dev, nginx.conf
├── scripts/                 backup, restore, deploy, legacy-import
├── tests/e2e/               Playwright
├── docs/
├── (prototype files stay at the root until Phase 8)
```

The prototype's root `package.json` stays as-is during transition; the workspace root is introduced with `pnpm-workspace.yaml` and the prototype is listed as its own package so both build.

## 4. Layering inside a domain module

```
packages/core/src/members/
├── members.policy.ts        who may do what (permission + branch scope)
├── members.service.ts       business rules, transactions, events
├── members.repository.ts    Prisma queries (tenant-scoped client only)
└── members.events.ts        domain events → notification / audit / jobs
apps/web/app/api/members/route.ts      HTTP: parse (Zod) → authn → service → envelope
apps/web/features/members/             React: hooks (TanStack Query), forms (RHF + Zod), tables
```

Rules: route handlers contain no business logic; services never read `req`; repositories never decide permissions; every write that changes money, stock, membership state or permissions emits an `AuditLog` row in the same transaction.

## 5. Request lifecycle

1. Nginx terminates TLS, applies basic rate limits, forwards to Next.js.
2. `withApi()` wrapper: request id, structured log, body size cap.
3. Authenticate (cookie session or bearer access token) → `User` + `Session`.
4. Resolve tenant: active `gymId` from session (user may switch among gyms they belong to); verify `GymMembership`; load role → permission set; load branch scope.
5. Check module entitlement (gym's SaaS plan includes the module).
6. Zod-validate params/query/body.
7. Service call inside a transaction with `SET LOCAL app.gym_id`.
8. Uniform response envelope (see `API_DOCUMENTATION.md`); errors mapped to codes, no stack traces.

## 6. Authorization model

- **Roles** (system-defined, per gym membership): `SUPER_ADMIN` (platform), `GYM_OWNER`, `GYM_MANAGER`, `BRANCH_MANAGER`, `COACH`, `ATHLETE`, `RECEPTIONIST`, `ACCOUNTANT`, `STORE_MANAGER`.
- **Permissions**: catalogue of strings in `packages/shared/permissions.ts` (`members.read`, `finance.manage`, …), mapped to roles in `RolePermission`. Gyms may later create custom roles from the same catalogue.
- **Scope**: `BranchStaff` limits branch-level roles to specific branches. Owner/manager are gym-wide. Coaches see only athletes linked via `CoachAthlete`. Athletes see only themselves.
- Policies are checked server-side; the UI uses the same catalogue only to hide controls.

## 7. Background jobs (BullMQ)

| Queue | Jobs |
|---|---|
| `notifications` | send SMS / push / email with retries, delivery log |
| `memberships` | daily expiry sweep, renewal reminders (7/3/1 days), auto-status changes |
| `saas` | gym subscription expiry, trial end, invoices |
| `reports` | nightly aggregates for dashboards |
| `imports` | member CSV/XLSX import with row-level error report |
| `ai` | long-running AI generations |

Every job carries an idempotency key; repeated jobs are no-ops.

## 8. AI engine

`packages/core/ai`: `AiProvider` interface, prompt template registry (versioned), context builders that **only include fields allowed by the gym's AI data-sharing setting** (default: no personal identifiers), per-gym and per-user quotas, `AIRequest` logging of tokens/cost/latency, and an approval state machine: AI-generated workout/nutrition plans are created as `DRAFT` and require a coach to publish.

## 9. Frontend

- Design source of truth: SmartGym 2.0 design board (Figma + `smartgym-design/*.html`). Tokens observed there: primary `#16A34A` (green-600), neutrals `#111827/#6B7280/#9CA3AF`, borders `#E5E7EB`, background `#F9FAFB`, radii 4–24 px, four elevation levels. These become Tailwind theme tokens in `packages/ui`.
- Font: **Peyda** self-hosted (the brand font of smartgymapp.ir; Vazirmatn until its files are added), Persian digits via `font-feature-settings` or a formatter. Light theme default, full RTL (`dir="rtl"`, logical CSS properties).
- Jalali calendar for display; all storage in UTC `timestamptz`.
- Data: TanStack Query; forms: React Hook Form + Zod resolvers from `packages/validation`; tables: TanStack Table with server-side pagination/sort/filter.
- Each page implements loading / empty / error / unauthorized / offline states via shared components.

## 10. Mobile (athlete app)

Expo (React Native, TypeScript) with Expo Router, SecureStore for tokens, TanStack Query with persisted cache for offline viewing of today's workout, a local SQLite queue for logging sets while offline (interrupted-workout recovery), Expo Notifications (FCM on Android). Shares `validation`, `shared`, `api-client` packages. EAS builds for Android first.

## 11. Infrastructure

Single Linux VPS (Iran-hosted recommended for latency/compliance) at launch:

```
Nginx (TLS, gzip, rate limit) ─▶ web (Next.js, Docker)
                              └▶ worker (Docker)
PostgreSQL 16 (Docker volume or managed)    Redis 7
S3-compatible object storage (ArvanCloud / MinIO)
```

Docker Compose for both local and production; `docker/nginx.conf`; `/api/health` (liveness) and `/api/health/ready` (DB + Redis). Nightly `pg_dump` to object storage with 14-day retention and a tested restore script. Staging and production as separate compose projects/databases. Migrations run with `prisma migrate deploy` in a release step, never `migrate dev`/`reset` against staging or production.

Observability: structured JSON logs (pino), error monitoring (Sentry-compatible, self-hosted GlitchTip is an option inside Iran), uptime check on `/api/health`.
