# SmartGym — Project Audit

| | |
|---|---|
| Audited commit | `3b04e08` (`main`, 2026-08-05) "feat: upgrade design system and expand platform core" |
| Audit date | 2026-11-07 |
| Scope | Entire repository (53 tracked files, ~23.5k lines excluding lockfile and images) |
| Method | Static reading of all server code, schema files, config and the frontend entry points; `npm ci`, `npm run lint` (tsc), `npm run build`; the production bundle was started locally **without** a database and the HTTP API was exercised with `curl`. No production system was touched. |

---

## 1. Executive summary

SmartGym today is a **single-page React prototype generated in Google AI Studio**, served by a thin Express server that exposes a **generic, unauthenticated "save any row to any table" API** on top of MySQL (or a local JSON file when MySQL is not configured).

- The UI covers a very wide surface (landing page, super admin, gym panel, coach panel, athlete panel, AI lab, installer) and builds cleanly.
- Almost all business logic lives in the browser, inside one 8,562-line component (`src/App.tsx`), with mock data seeded from `src/data.ts`.
- **There is no server-side authentication, authorization or tenant isolation.** Logins for gyms, coaches and athletes are done by downloading the whole user table to the browser and comparing plain-text passwords there. Super admin "login" state is a `localStorage` flag.
- Payments and SMS/OTP are **simulators** that run entirely in the browser.
- There is **no mobile app**, no migrations, no tests, no background jobs and no audit logging.

**Conclusion:** the existing code is valuable as a product prototype (screens, flows, Persian copy, exercise data, AI prompts) but the backend, data model and auth cannot be hardened incrementally into the production platform the brief describes. The recommended path (see `ARCHITECTURE.md`) is to build SmartGym 2.0 as a new, properly layered codebase **alongside** the existing code, port the useful parts, and retire the prototype only once each module reaches parity. Nothing existing is deleted in Phase 1.

> ⚠️ **If any deployment of this code is publicly reachable (e.g. smartgymapp.ir), it should be treated as compromised-by-design today.** See §6, findings C-1 to C-4. An emergency hotfix is proposed in `DEVELOPMENT_ROADMAP.md` Phase 0.

---

## 2. Technology inventory

| Area | What exists | Version (from `package.json` / lockfile) | Notes |
|---|---|---|---|
| Frontend framework | React SPA, Vite | react 19.0, vite 6.2 | Not Next.js. Single entry `src/main.tsx` → `src/App.tsx` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) | 4.1 | Custom CSS in `src/index.css`; font **Vazirmatn** from Google Fonts (brief requires IRANYekan) |
| Icons | lucide-react | 0.546 | Matches brief |
| Charts | recharts | 3.x | Matches brief |
| Animation / 3D | motion, three.js | 12.x / 0.185 | `ThreeGymCanvas.tsx` (811 lines) |
| Forms / validation | Hand-written `useState` + manual checks | — | No React Hook Form, no Zod |
| Data fetching | Raw `fetch` | — | No TanStack Query |
| Backend | Express 4 in `server.ts`, routes in `server/routes/api.ts` | express 4.21 | Vite middleware in dev, static `dist/` in prod |
| Database | MySQL via `mysql2` pool; JSON-file fallback `db_fallback.json` | mysql2 3.x | Hand-written `CREATE TABLE` in 3 places (see §4) |
| ORM / migrations | None | — | |
| Auth libs | `jsonwebtoken`, `bcryptjs` installed | | **Imported but never used by any route** |
| AI | `@google/genai` (Gemini), server-side | 2.4 | Model id `gemini-3.5-flash` hard-coded; requires investigation that it is a valid model id |
| Hosting | cPanel "Setup Node.js App" (Passenger), `app.js` → `dist/server.cjs`; PHP installer `easy_installer.php` | | Guides: `README_cPanel.md`, `CPANEL_MYSQL_GUIDE.md` |
| Firebase | `firebase-applet-config.json`, `firestore.rules`, `firebase-blueprint.json` | | SDK removed in commit `1a099ff`; config files remain (see H-5) |
| Mobile | — | | Not present |
| Tests / CI | — | | No test runner, no GitHub Actions |
| Linting | `npm run lint` = `tsc --noEmit` | TS 5.8 | No ESLint/Prettier |

### Build verification (run during audit)

| Command | Result |
|---|---|
| `npm ci` | ✅ installs |
| `npm run lint` (`tsc --noEmit`) | ✅ 0 errors |
| `npm run build` | ✅ builds; **1.75 MB** main JS chunk (447 KB gzip), two ~560 KB JPG mascots |
| `node dist/server.cjs` (no DB) | ✅ starts, uses JSON fallback |

---

## 3. Source layout

```
server.ts                      Express bootstrap (helmet w/ CSP off, cors(*), 50 MB JSON body)
server_db.ts                   re-exports server/config/database.ts
server/config/database.ts      MySQL pool + JSON-file fallback + generic table CRUD
server/controllers/dbController.ts   thin wrappers for /api/db/*
server/routes/api.ts           AI, installer, admin login, generic CRUD routes
server/middleware/auth.ts      authenticateToken / requireRole  (UNUSED)
server/middleware/error.ts     error handler (returns err.message to client)
server/middleware/logger.ts    request logger
server/utils/auth.ts           bcrypt / JWT helpers (UNUSED; default secret hard-coded)
src/App.tsx                    8,562 lines: routing, state, all panels, all business logic
src/data.ts                    exercises, plans, MOCK_* seed data (tenants, members, coaches, invoices, …)
src/types.ts                   domain types (UserRole, Tenant, Exercise, WorkoutProgram, …)
src/components/*.tsx           17 feature components (one empty: WorkoutPlayerWidget.tsx)
database.sql, schema_cpanel.sql        MySQL schema (15 tables)
easy_installer.php, config_db.php      PHP installer for cPanel
```

---

## 4. Database (as found)

Three copies of the schema exist and must be kept in sync by hand: `database.sql`, `schema_cpanel.sql`, and the inline `CREATE TABLE` strings in `server/routes/api.ts` (`/installer/setup-db`).

Tables (15): `tenants`, `members`, `coaches`, `membership_requests`, `workout_programs`, `nutrition_plans`, `store_products`, `bookings`, `tickets`, `attendance_records`, `exercises_database`, `coach_sales`, `blog_posts`, `smart_support_chats`, `platform_settings`.

Observations:

- **No foreign keys, no indexes** besides primary keys, no unique constraints (usernames can collide).
- All IDs are client-generated `VARCHAR(100)`.
- **Dates stored as `VARCHAR`** (`createdAt`, `expiresAt`, `date`, …).
- **Money stored as `DECIMAL(15,2)`** with no currency unit documented (`priceToman` naming implies toman). `attendance_records.totalHours` is `DOUBLE`.
- Nested structures stored as JSON text (`schedule`, `meals`, `replies`, `messages`, `whiteLabelTheme`).
- Tenant column is inconsistently named (`clubId` vs `tenantId`) and **defaults to the literal `'oxigen'`** (a demo gym) — new rows without a tenant silently belong to that gym.
- **Plain-text passwords** in `tenants.password`, `members.password`, `coaches.password`; super admin password in `platform_settings.admin_password` (and `admin_config` JSON from the PHP installer).
- Body measurements stored as `VARCHAR` columns on `members` (no history).
- No users table: identity is split across `tenants`, `coaches`, `members`.
- No soft deletion, no timestamps maintained by the DB, no migration history.

**Existing production data:** unknown. If a live MySQL database holds real gyms/members, a one-time import script into the new schema is needed (see roadmap Phase 1, task F-9). This requires investigation with the owner.

---

## 5. API endpoints (as found)

All routes are mounted under `/api`. **None require authentication.** Verified with `curl` against a local build.

| Method & path | Purpose | Auth | Verified behaviour |
|---|---|---|---|
| `POST /ai/workout` | Gemini workout plan from body params | none | Returns 500 with message when `GEMINI_API_KEY` missing |
| `POST /ai/nutrition` | Gemini nutrition plan | none | same |
| `POST /ai/chat` | Gemini chat; `userRole` taken from body | none | same |
| `GET /installer/status` | Shows DB host/user/name, admin username | none | ✅ leaks config |
| `POST /installer/test-db` | Connects to any MySQL host given in body | none | SSRF-style probe of internal hosts possible |
| `POST /installer/setup-db` | Creates tables, **rewrites `.env`**, reconnects pool | none | Not run (needs MySQL); code path reviewed |
| `POST /installer/save-admin` | Sets super admin username/password | none | ✅ **Overwrote admin credentials and `.env` with no auth** |
| `POST /admin/login` | Compares plain text vs settings/env | none | ✅ accepts the attacker-set password; returns no token |
| `GET /platform/settings` | All platform settings | none | ✅ **Returns `admin_password` in plain text** |
| `POST /platform/settings` | Overwrite any setting | none | reviewed |
| `GET /db/:table` | Dump whole table (15 allowed tables) | none | ✅ returns all rows incl. passwords for every gym |
| `POST /db/:table` | Upsert any row, any columns | none | ✅ wrote a member into another gym's `clubId` |
| `POST /db/:table/batch` | Upsert many rows | none | reviewed; the SPA calls this on every state change |
| `DELETE /db/:table/:id` | Delete any row | none | reviewed |

There is no `/api/health`; `GET /api/health` currently returns the SPA `index.html` with 200.

---

## 6. Security findings

Severity: **C** critical, **H** high, **M** medium, **L** low.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| C-1 | C | Unauthenticated super-admin takeover: `POST /api/installer/save-admin` sets admin credentials and writes `.env`; installer routes are never locked after install | Reproduced locally |
| C-2 | C | Unauthenticated read/write/delete of every table for every gym via `/api/db/:table` (no tenant isolation) | Reproduced locally |
| C-3 | C | Plain-text passwords for super admin, gyms, coaches and members; super admin password returned by `GET /api/platform/settings`; gym credentials displayed in the admin UI and `alert()` | Reproduced; `App.tsx:1576`, `2920`, `5638` |
| C-4 | C | Client-side authentication: gym/coach/member login compares passwords in the browser against the downloaded table; super admin session is `localStorage.isSuperAdminLoggedIn === "true"` | `App.tsx:285`, `1687`, `3825`, `5003` |
| H-1 | H | `POST /installer/setup-db` rewrites `.env` from request body and `/installer/test-db` connects to arbitrary hosts | `api.ts` |
| H-2 | H | Hard-coded default secrets: `JWT_SECRET` fallback in `server/utils/auth.ts`; real-looking secrets in `.env.example`; default `admin/admin123` in PHP installer | |
| H-3 | H | AI endpoints are unauthenticated and unmetered → anyone can spend the Gemini quota; prompt fields are interpolated directly | `api.ts` |
| H-4 | H | Payment gateway and SMS OTP are browser simulators; OTP codes generated with `Math.random()` in the client; SMS provider config (Melipayamak) and payment merchant IDs stored in `localStorage` | `SmsOtpAuthenticationSystem.tsx`, `IranianGatewaySimulator.tsx`, `App.tsx:422-425` |
| H-5 | H | `firestore.rules` allows `read, write: if true`; Firebase project config committed. If that Firebase project/database still exists, it is world-writable | `firestore.rules`, `firebase-applet-config.json` |
| M-1 | M | `helmet` with CSP disabled, `cors()` open to all origins, 50 MB JSON body limit | `server.ts` |
| M-2 | M | Error handler returns raw `err.message` (DB errors) to clients | `server/middleware/error.ts` |
| M-3 | M | No rate limiting or login-attempt protection anywhere | |
| M-4 | M | `db_fallback.json` (created at runtime, contains all data incl. passwords) is not in `.gitignore` | |
| M-5 | M | `easy_installer.php` sets `display_errors=1` and can be re-run if `install.lock` is removed | |
| L-1 | L | Third-party font loaded from Google Fonts (availability inside Iran; privacy) | `index.css:1` |
| L-2 | L | No audit log; `MOCK_AUDIT_LOGS` displayed as if real | `App.tsx:2968` |

**Immediate owner actions (outside the code):** rotate the super admin password and every gym/coach/member password on any live deployment; delete or lock the Firebase project `formal-answer-s18qq` Firestore database; remove `easy_installer.php` from the web root of any live host.

---

## 7. Feature status

Legend: ✅ Implemented and verified · 🟡 Partially implemented · 🎨 UI only · ⚙️ Backend only · ❌ Not implemented · 🔍 Requires investigation.

"Partially implemented" here means data round-trips to the database through the generic API but without server-side validation, authorization or business rules. **No feature meets the brief's Definition of Done**, so none is marked ✅.

### Platform / auth

| Feature | Status | Notes |
|---|---|---|
| Phone registration + OTP | 🎨 | Browser simulator only |
| Username/password login (gym, coach, athlete) | 🟡 | Works functionally but insecure (C-4) |
| Super admin login | 🟡 | Server compares, but session is a localStorage flag |
| Logout, sessions, devices, refresh tokens | ❌ | |
| Roles (brief: 9 roles) | 🎨 | `UserRole` enum has 8 different roles; not enforced |
| RBAC permissions | ❌ | |
| Multi-tenancy | 🟡 | `clubId` column exists; filtering happens in the browser |
| Tenant branding (white label) | 🟡 | `whiteLabelTheme` stored; applied client-side |
| Installer | 🟡 | Works, but is the C-1 vulnerability |

### Gym manager

| Feature | Status | Notes |
|---|---|---|
| Dashboard KPIs & charts | 🎨 | Computed from mock/in-memory arrays |
| Members CRUD | 🟡 | Create/list/edit persisted; no archive, history, import/export |
| Membership plans, renewal, suspension | 🎨 | Plans in `localStorage` |
| Membership requests | 🟡 | `membership_requests` table |
| Attendance (manual) | 🟡 | `attendance_records` table; seeded with mock |
| Attendance (QR) | 🔍 | QR references found in UI copy; no secure token flow |
| Financial (income, expenses, P&L) | 🎨 | `MOCK_INVOICES` |
| Coach management | 🟡 | `coaches` table |
| Coach commissions / earnings | 🟡 | `coach_sales` table + `CoachEarningsPanel` |
| Store products | 🟡 | `store_products`; no inventory movements, purchases, suppliers |
| Buffet | 🎨 | |
| Multi-branch | 🎨 | `branchesCount` integer only |
| Loyalty | 🎨 | |
| Class bookings | 🟡 | `bookings` table (not in brief's core list) |
| Reports | 🎨 | |

### Coach

| Feature | Status | Notes |
|---|---|---|
| Coach dashboard / athlete list | 🟡 | |
| Member detail, measurements | 🟡 | Single snapshot on `members` row, no history |
| Workout builder | 🟡 | Manual builder + AI generator; stored as JSON blob |
| Exercise library | 🟡 | ~340 lines of exercises in `data.ts` + `exercises_database` table; custom 2D animations |
| Nutrition builder | 🟡 | Stored as JSON blob |
| Progress photos | ❌ | |

### Athlete

| Feature | Status | Notes |
|---|---|---|
| Athlete web dashboard | 🟡 | `AthleteDashboard.tsx` (1,394 lines) |
| Workout tracking / rest timer | 🎨 | Session results not persisted; `WorkoutPlayerWidget.tsx` is empty |
| Nutrition logging, water | 🎨 | |
| Native mobile app | ❌ | |

### Smart AI

| Feature | Status | Notes |
|---|---|---|
| Workout & nutrition generation | ⚙️/🟡 | Server calls Gemini; needs key; untested end-to-end (no key available in audit) |
| AI chat | 🟡 | Same |
| Provider abstraction, usage limits, logging, approval workflow | ❌ | |

### Super admin

| Feature | Status | Notes |
|---|---|---|
| Gym (tenant) CRUD | 🟡 | Insecure |
| SaaS plans & feature gating | 🎨 | Plans in `localStorage`; gating is client-side |
| SaaS billing / invoices | 🎨 | Gateway simulator |
| Support tickets | 🟡 | `tickets` table, `TicketSystem.tsx` |
| Smart support chat | 🟡 | `smart_support_chats` table; polled |
| Blog / CMS | 🟡 | `blog_posts` table |
| SMS management | 🎨 | localStorage |
| Monitoring center | 🎨 | `PlatformMonitoringCenter.tsx` shows simulated metrics |
| Audit logs | 🎨 | Mock |

### Cross-cutting

| Item | Status |
|---|---|
| Notifications (in-app/SMS/push) | ❌ |
| Background jobs | ❌ |
| File uploads / object storage | ❌ |
| Tests (unit/integration/E2E) | ❌ |
| CI | ❌ |
| Health check endpoint | ❌ |
| Backups | ❌ |
| Docker / Nginx config | ❌ |

---

## 8. What is worth keeping

| Asset | Reuse plan |
|---|---|
| Persian product copy, flows, screen inventory | Reference for new screens together with the SmartGym 2.0 design board |
| `src/data.ts` exercise library + `ExerciseAnimation.tsx` | Convert to dev/staging seed for the `Exercise` model; keep animations as a component |
| AI prompt templates in `api.ts` | Move into the AI prompt-template registry |
| `types.ts` domain vocabulary | Input to the Prisma schema |
| Blog, ticketing, smart-chat flows | Re-implement on the new API |
| `toPersianNums` helper | Move to `packages/shared` |

## 9. What must not be carried over

Generic `/api/db/:table` CRUD; client-side login; plain-text passwords; installer endpoints; localStorage-backed business data; mock data as runtime fallback; browser payment/SMS simulators (they become explicit sandbox adapters on the server).

## 10. Open questions for the owner

1. Is any version of this code live on smartgymapp.ir today, and does its MySQL database contain real gyms or members that must be migrated?
2. Hosting: the brief says Linux VPS + Nginx; the repo targets cPanel. Is a VPS available (with root, Docker, PostgreSQL, Redis)?
3. Which SMS provider account exists (Kavenegar, Melipayamak, Ghasedak, …) and which payment gateway (Zarinpal, SEP, IDPay, …)?
4. Which AI provider(s) are acceptable given data-residency concerns for Iranian gyms?
5. Is IRANYekan licensed for web and app embedding (it is a commercial font)?
