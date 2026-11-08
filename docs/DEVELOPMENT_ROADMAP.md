# SmartGym 2.0 — Development Roadmap

Each phase ends with a report (implemented features, modified files, new models, endpoints, tests and results, known bugs, remaining work). A task is "done" only when it meets the Definition of Done in the brief: UI, responsive, API, DB, validation, authorization, error handling, loading states, automated tests, docs.

Priorities, in order: security → data integrity → scalability → maintainability → UX → performance → reliability.

---

## Phase 0 — Emergency hardening of the prototype (only if it is deployed)

Small PR against the existing code. Does not change features. **Needs owner confirmation that a live deployment exists.**

- Disable `/api/installer/*` when `INSTALL_LOCKED=true` or a DB is already configured (default locked).
- Stop returning `admin_password` from `GET /api/platform/settings`; hash the super admin password with bcrypt.
- Require an admin token for `POST /api/platform/settings` and `/api/db/*` writes; restrict `GET /api/db/*` for credential-bearing tables.
- Add `db_fallback.json` to `.gitignore`; remove secrets from `.env.example`; delete the `JWT_SECRET` fallback.
- Owner actions: rotate all passwords, lock Firebase project, remove `easy_installer.php` from the web root.

## Phase 1 — Audit and foundation  ✅ (PRs #1–#3)

| # | Task | Output |
|---|---|---|
| F-1 | Audit + design docs | the six docs in `docs/` ✅ (this PR) |
| F-2 | Workspace scaffold | pnpm + Turborepo; `apps/web` (Next.js), `apps/worker`, `packages/{core,db,validation,shared,api-client,ui}`; ESLint, Prettier, Vitest, Playwright; GitHub Actions CI (lint, typecheck, test, build) |
| F-3 | Local infra | `docker/compose.dev.yml` (Postgres 16, Redis 7, MinIO, Mailpit); `.env.example` with validated env (Zod) |
| F-4 | Database v1 | Prisma schema for identity, tenancy, RBAC, audit (`User`, `UserProfile`, `Session`, `OtpChallenge`, `Role`, `Permission`, `RolePermission`, `Gym`, `GymMembership`, `Branch`, `BranchStaff`, `GymSetting`, `Module`, `SubscriptionPlan`, `GymSubscription`, `AuditLog`, `FileAsset`); RLS policies migration; dev seed |
| F-5 | Tenant context | Prisma extension + `SET LOCAL` + RLS; isolation integration tests |
| F-6 | Auth | phone + OTP (sandbox SMS adapter + Kavenegar/Melipayamak adapter), optional password (argon2id), web session cookies + CSRF, mobile access/refresh with rotation, logout, device list, rate limiting + lockout (Redis) |
| F-7 | RBAC | permission catalogue, role→permission seed, `requirePermission()` policy helpers, tests per role |
| F-8 | Design system | tokens from the design board, Peyda (Vazirmatn until the font files arrive), RTL, shadcn components (button, input, select, table, dialog, toast, empty/error states), app shell for manager/coach/super-admin |
| F-9 | Legacy import (if needed) | script to import an existing MySQL dump into the new schema, re-hashing nothing (forces password reset/OTP on first login) |
| F-10 | Ops baseline | `/api/health`, structured logging, Dockerfiles, Nginx config, backup + restore scripts |

**Exit criteria:** a gym owner can sign up with phone + OTP, create a gym and a branch, invite a manager by phone, and the manager logs in and sees an empty manager shell; tenant isolation tests pass; CI green.

## Phase 2 — Manager core  ← **current**

Decisions (2026-11-07): the prototype is not live and holds no real data, so F-9 (legacy import) is dropped. SMS: **Melipayamak**. Payments: **Saman (SEP)**. Hosting: AlmaLinux VPS. Font: **Peyda** (the brand font on smartgymapp.ir; files to be supplied).

Done in the first Phase 2 PR: Melipayamak OTP adapter; members (create, edit, archive/restore, search by name/phone/number with Persian digits, membership tabs with counts, branch scoping); membership plans (`plans.manage`); sell, renew, suspend, resume, cancel; manual check-in/check-out with entry limits, branch rules and concurrency safety; dashboard KPIs from real data; Jalali date helpers.
Done in the second Phase 2 PR: member notes, coaches (profile, specialties, commission rate, assignment with history), CSV export (`members.export`) and all-or-nothing CSV import with a row-by-row error report (UTF-8 and Windows-1256 files; Arabic ي/ك normalised).
Still to do in Phase 2: profile image, member timeline, XLSX (CSV works with Excel today), discount and gift codes, expiry job and SMS reminders (needs the worker), QR check-in, attendance stats and peak hours, coach availability.


Members (CRUD, archive, search/filters, profile image, emergency contact, notes, timeline, CSV/XLSX import with error report, export), membership plans (pricing, duration, entry limits, branch restriction, discounts, gift codes), member subscriptions (activate, renew, suspend, cancel, history, automatic expiry job + reminders), attendance (manual + signed rotating QR check-in, validation against active subscription, entry/exit, daily/branch/peak-hour stats), coaches (profiles, specializations, assignments, availability), manager dashboard (real aggregates with date/branch/plan filters).

## Phase 3 — Business operations  ← **started**

Done in the first Phase 3 PR: payments at the counter (cash, card POS, transfer) with the sale or as instalments, derived debts, refunds, append-only ledger, daily till report per method and branch, debtors list.


Finance (payments with idempotency keys, transactions ledger, expenses, categories, debts, refunds, coach commissions/settlements, P&L, reconciliation; Saman (SEP) adapter), store (products, categories, suppliers, purchases, sales, returns, inventory movements for every stock change, low-stock alerts), buffet (menu, orders, status, payment, inventory), multi-branch (branch inventory, member transfer, consolidated reports), loyalty (accounts, earn/redeem rules), reports.

## Phase 4 — Coach portal

Coach dashboard, athlete profiles with consent for health data, measurements history, progress photos (private object storage, signed URLs), exercise library (seeded from the prototype's `data.ts`, media), workout builder (days, sets/reps/weight/rest/tempo, templates, versioning, publish), nutrition builder (food DB, meals, macros, schedule), medical disclaimer.

## Phase 5 — Athlete app (Expo, Android first)

Auth (OTP), home, workout player (set/rep/weight logging, rest timer, offline queue, interrupted session recovery, summary), nutrition logging + water, progress (weight, measurements, charts, photos, PRs), profile (membership, coach, notifications, security, sessions), push notifications. Mobile web view for athletes remains in `apps/web/athlete`.

## Phase 6 — Smart AI

Provider abstraction, prompt registry, privacy-filtered context builders, quotas and token accounting, `AIRequest` log, approval workflow (AI drafts → coach publishes), manager insights (churn risk, renewals, attendance, inventory), coach assistant, athlete assistant.

## Phase 7 — Super admin

Platform dashboard (gyms, users, MRR, growth, health), gym lifecycle (create, suspend, activate, modules), SaaS plans (monthly/annual, trials, feature limits), billing + invoices, support tickets (categories, assignment, internal notes), platform settings, maintenance mode, audit log viewer, audited "view as gym" access.

## Phase 8 — QA and production

Full Playwright suite for the 10 brief scenarios, security review (OWASP ASVS L2 checklist), load test of dashboard and check-in endpoints, mobile device testing, staging deployment, production deployment with verified health checks and rollback rehearsal, retirement of the prototype into `legacy/`.

---

## Sizing note

This is a large platform. Realistic delivery is one phase (sometimes half a phase) per PR series, each reviewed before the next begins. Work proceeds in small PRs (one module or one cross-cutting concern each) so every step can be tested and reverted.
