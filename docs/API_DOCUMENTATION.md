# SmartGym 2.0 — API Documentation

Status: **design contract** for Phase 1+. The machine-readable spec will be generated from the Zod schemas in `packages/validation` (via `zod-to-openapi`) and served at `/api/docs` (Swagger UI, disabled in production unless authenticated as super admin). This document defines the conventions every endpoint follows and the planned surface. Endpoints are marked with the phase that delivers them.

The prototype's endpoints (`/api/db/*`, `/api/installer/*`, `/api/admin/login`, `/api/platform/settings`, `/api/ai/*`) are documented in `PROJECT_AUDIT.md` §5 and are **not** part of this contract.

---

## 1. Conventions

**Base URL:** `https://smartgymapp.ir/api` · **Versioning:** `/api/v1/...` (examples below omit `/v1`). · **Format:** JSON, UTF-8.

**Authentication**
- Web: session cookie `sg_session` (HttpOnly, Secure, SameSite=Lax) + header `X-CSRF-Token` on non-GET requests.
- Mobile: `Authorization: Bearer <access_token>`.

**Tenant context:** taken from the session's active gym. Clients switch gym with `POST /auth/active-gym`. A `gymId` in a URL or body is **never** trusted for authorization; it is only accepted on super-admin routes.

**Success envelope**
```json
{ "data": { ... }, "meta": { "requestId": "01J..." } }
```
Collections:
```json
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 25, "total": 312, "requestId": "..." } }
```

**Error envelope**
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "شماره تلفن معتبر نیست", "fields": { "phone": ["invalid_format"] } }, "meta": { "requestId": "..." } }
```

| HTTP | `code` examples |
|---|---|
| 400 | `VALIDATION_FAILED`, `BAD_REQUEST` |
| 401 | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| 403 | `FORBIDDEN`, `MODULE_NOT_IN_PLAN`, `GYM_SUSPENDED` |
| 404 | `NOT_FOUND` (also used for resources of other tenants, to avoid leaking existence) |
| 409 | `CONFLICT`, `DUPLICATE`, `IDEMPOTENCY_REPLAY` |
| 422 | `BUSINESS_RULE` (e.g. `SUBSCRIPTION_EXPIRED`, `INSUFFICIENT_STOCK`) |
| 429 | `RATE_LIMITED` (with `Retry-After`) |
| 500 | `INTERNAL` (message is generic; details only in logs by `requestId`) |

**Collections:** `?page=1&pageSize=25` (max 100), `?sort=-createdAt,name`, `?q=` full-text, field filters `?status=ACTIVE&branchId=...`, date ranges `?from=2026-01-01&to=2026-01-31` (ISO dates; UI converts from Jalali).

**Idempotency:** `Idempotency-Key: <uuid>` header is **required** on payment, refund, sale, buffet order, check-in and import endpoints. Same key + same body → original response replayed; same key + different body → 409.

**Money:** integers in rial, field names end with `AmountRial`. Dates: ISO 8601 UTC.

**Rate limits (defaults):** OTP request 3/10 min per phone and 10/10 min per IP; login 10/15 min per IP; AI 30/hour per user (plan-dependent); general 300/min per session.

---

## 2. Endpoints

`perm:` lists the permission required (in addition to tenant membership). `P1`…`P7` = roadmap phase.

### 2.1 Health — P1
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | Liveness `{status:"ok"}` |
| GET | `/health/ready` | none (internal) | DB + Redis checks |

### 2.2 Auth — `/api/auth` — P1
| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/request` | `{phone, purpose: "LOGIN"\|"REGISTER"\|"RESET"}` → sends OTP (always 202, no user enumeration) |
| POST | `/auth/otp/verify` | `{phone, code, device?}` → creates session (cookie or tokens) |
| POST | `/auth/password/login` | `{phone, password}` where enabled |
| POST | `/auth/password/set` | authenticated; set/change password (requires recent OTP) |
| POST | `/auth/refresh` | mobile: `{refreshToken}` → rotated pair |
| POST | `/auth/logout` | revoke current session |
| GET | `/auth/me` | user, profile, gyms + roles, active gym, permissions |
| POST | `/auth/active-gym` | `{gymId}` must be one of the user's memberships |
| GET | `/auth/sessions` | device list |
| DELETE | `/auth/sessions/:id` | revoke a device |
| POST | `/auth/register-gym` | new owner + gym + trial subscription (after OTP) |

### 2.3 Users & staff — `/api/users` — P1
| Method | Path | perm |
|---|---|---|
| GET | `/users/staff` | `staff.read` |
| POST | `/users/staff/invite` | `staff.manage` — `{phone, role, branchIds[]}` |
| PATCH | `/users/staff/:membershipId` | `staff.manage` |
| DELETE | `/users/staff/:membershipId` | `staff.manage` |
| PATCH | `/users/me/profile` | self |

### 2.4 Gyms & branches — P1/P3
| Method | Path | perm |
|---|---|---|
| GET/PATCH | `/gyms/current` | `settings.manage` for PATCH |
| GET/PUT | `/gyms/current/settings` | `settings.manage` |
| GET/POST | `/branches` | `branches.read` / `branches.manage` |
| GET/PATCH/DELETE | `/branches/:id` | `branches.manage` |

### 2.5 Members — `/api/members` — P2

Implemented in Phase 2 (under `/api/v1`): list (`q, status, membership=active|expiring|expired|suspended|none, branchId, page, pageSize`; the response includes per-tab `counts`), create, get, update, archive, restore. Part 2 adds: `GET/POST /members/:id/notes` (append-only; `members.read` / `members.update`), `POST /members/:id/coach {coachUserId|null}` (`coaches.manage`), `GET /members/export` (`members.export`, CSV with BOM, formula-safe), `POST /members/import` (`members.create`, body `text/csv`, `?dryRun=1`; all rows or none, report lists row/column/message). Timeline is still to do.

| Method | Path | perm |
|---|---|---|
| GET | `/members` | `members.read` — filters: `q, status, branchId, planId, coachId, expiringWithinDays` |
| POST | `/members` | `members.create` |
| GET | `/members/:id` | `members.read` |
| PATCH | `/members/:id` | `members.update` |
| POST | `/members/:id/archive` · `/restore` | `members.delete` |
| GET | `/members/:id/timeline` | `members.read` |
| GET/POST | `/members/:id/notes` | `members.read` / `members.update` |
| POST | `/members/:id/coach` | `coaches.manage` |
| POST | `/members/import` | `members.create` — multipart CSV/XLSX → job id |
| GET | `/members/import/:jobId` | status + downloadable error report |
| GET | `/members/export` | `members.read` — CSV/XLSX |

### 2.6 Memberships — `/api/memberships` — P2
| Method | Path | perm |
|---|---|---|
| GET | `/memberships/plans` (`?all=1` includes inactive) | `members.read` |
| POST | `/memberships/plans` | `plans.manage` |
| PATCH | `/memberships/plans/:id` | `plans.manage` (deactivate with `isActive:false`; plans are never hard-deleted) |
| GET | `/members/:id` returns the member's periods | `members.read` |
| POST | `/memberships` | `memberships.manage` — `{memberId, planId, branchId?, startsAt?, discountAmountRial?, note?}`. Without `startsAt`, a sale for a member with a running period is a renewal that starts when that period ends. Payment recording arrives with finance (P3). |
| POST | `/memberships/:id/suspend` · `/resume` · `/cancel` | `memberships.manage` — resume adds the suspended days back |
| GET/POST | `/memberships/discounts` | `memberships.manage` |

### 2.7 Attendance — `/api/attendance` — P2

Implemented in Phase 2: manual `check-in` `{memberId, branchId}`, `check-out`, and `GET /attendance` (defaults to today in Tehran; returns `total` and `inside`). QR check-in, stats and `my-qr` are still to do. A second check-in while a visit is open (no check-out, under 4 hours) returns 409.

| Method | Path | perm |
|---|---|---|
| POST | `/attendance/check-in` | `attendance.manage` — `{memberId \| qrToken, branchId}` + Idempotency-Key |
| POST | `/attendance/:id/check-out` | `attendance.manage` |
| GET | `/attendance` | `attendance.read` — filters: date range, branch, member |
| GET | `/attendance/stats` | `reports.read` — daily, per branch, peak hours |
| GET | `/attendance/my-qr` | athlete — short-lived signed token |

### 2.8 Coaches — `/api/coaches` — P2/P4
| Method | Path | perm |
|---|---|---|
| GET | `/coaches` | `coaches.read` — coaches are staff with the COACH role (added via `/users/staff/invite`); includes profile and current athlete count |
| PATCH | `/coaches/:userId` | `coaches.manage` — `{bio?, specializations?, commissionRateBp?}` |
| GET/PATCH | `/coaches/:id` | |
| GET/PUT | `/coaches/:id/availability` | |
| GET | `/coaches/:id/athletes` | coach self or `coaches.read` |
| GET | `/coaches/me/dashboard` | coach |

### 2.9 Workouts & exercises — P4
| Method | Path | perm |
|---|---|---|
| GET/POST | `/exercises` | `workouts.read` / `workouts.manage` |
| GET/PATCH/DELETE | `/exercises/:id` | |
| GET/POST | `/workouts` | `workouts.manage` (coach scope) |
| GET/PUT | `/workouts/:id` | full tree (days, exercises) |
| POST | `/workouts/:id/publish` · `/new-version` · `/assign` | |
| GET | `/workouts/me/today` | athlete |
| POST | `/workouts/sessions` | athlete — start (with `clientSessionId`) |
| POST | `/workouts/sessions/:id/sets` | athlete — log set(s), batch, offline-safe |
| POST | `/workouts/sessions/:id/complete` | athlete |

### 2.10 Nutrition & measurements — P4/P5
| Method | Path | perm |
|---|---|---|
| GET/POST | `/nutrition/plans` | `nutrition.manage` |
| GET/PUT | `/nutrition/plans/:id` · POST `/publish` · `/assign` | |
| GET | `/nutrition/foods?q=` | any |
| GET/POST | `/nutrition/logs` | athlete (self) |
| POST | `/nutrition/water` | athlete |
| GET/POST | `/measurements?memberId=` | coach (assigned) / athlete (self) |
| POST | `/measurements/photos` | multipart; private storage |

### 2.11 Finance — P3

Implemented (Phase 3 part 1, under `/api/v1`): `POST /payments {subscriptionId, amountRial, method: CASH|CARD_POS|TRANSFER, reference?, note?}` with optional `Idempotency-Key` (`memberships.manage`, so counter staff can take instalments; never more than the balance); `POST /memberships` accepts `payment` to take money with the sale; `POST /payments/:id/refund {amountRial, method, reason}` (`finance.manage`); `GET /members/:id/payments`; `GET /finance/cash-report?date=&branchId=` (Tehran day, per-method totals; `finance.read` or `memberships.manage`, branch-scoped); `GET /finance/debts` (`finance.read`). Online gateway (Saman), expenses, categories and commissions are next.

| Method | Path | perm |
|---|---|---|
| GET/POST | `/payments` | `finance.read` / `finance.manage` (Idempotency-Key) |
| POST | `/payments/online/start` | creates gateway request → redirect URL |
| GET | `/payments/online/callback/:gateway` | gateway callback, server-side verify |
| POST | `/payments/:id/refund` | `finance.manage` |
| GET | `/transactions` | `finance.read` |
| GET/POST | `/expenses` | `finance.read` / `finance.manage` |
| GET/POST | `/finance/categories` | `finance.manage` |
| GET | `/finance/debts` | `finance.read` |
| GET | `/finance/commissions` · POST `/finance/settlements` | `finance.manage` |

### 2.12 Store, inventory, buffet — P3
| Method | Path | perm |
|---|---|---|
| GET/POST | `/products` · `/products/categories` · `/products/suppliers` | `store.read` / `store.manage` |
| GET | `/inventory?branchId=` | `store.read` |
| POST | `/inventory/adjust` · `/inventory/transfer` | `store.manage` |
| GET | `/inventory/movements` | `store.read` |
| POST | `/store/purchases` · `/store/sales` · `/store/returns` | `store.manage` |
| GET/POST | `/buffet/orders` · PATCH `/buffet/orders/:id/status` | `buffet.manage` |

### 2.13 Loyalty, notifications, reports — P3
| Method | Path | perm |
|---|---|---|
| GET | `/loyalty/accounts/:memberId` · POST `/loyalty/adjust` | `loyalty.manage` |
| GET | `/notifications` · POST `/notifications/:id/read` · `/read-all` | self |
| GET/PUT | `/notifications/preferences` | self |
| GET | `/reports/dashboard?from&to&branchId&planId` | `reports.read` |
| GET | `/reports/revenue` · `/reports/memberships` · `/reports/attendance` · `/reports/store` · `/reports/coaches` | `reports.read` |

### 2.14 AI — `/api/ai` — P6
| Method | Path | Description |
|---|---|---|
| POST | `/ai/workouts/draft` | coach — creates `DRAFT` workout from structured inputs |
| POST | `/ai/nutrition/draft` | coach — creates `DRAFT` nutrition plan |
| POST | `/ai/chat` | role-scoped assistant; streamed (SSE) |
| GET | `/ai/insights` | manager — churn, renewals, attendance, inventory |
| GET | `/ai/usage` | quota used / remaining |

### 2.15 Super admin — `/api/admin` — P7 (requires `is_super_admin`; every call audited)
| Method | Path |
|---|---|
| GET | `/admin/dashboard` |
| GET/POST | `/admin/gyms` · GET/PATCH `/admin/gyms/:id` · POST `/admin/gyms/:id/suspend` · `/activate` |
| PUT | `/admin/gyms/:id/modules` |
| GET/POST | `/admin/plans` · PATCH `/admin/plans/:id` |
| GET | `/admin/invoices` · `/admin/payments` |
| GET | `/admin/audit-logs` · `/admin/system-events` |
| GET/PUT | `/admin/settings` · POST `/admin/maintenance` |

### 2.16 Subscriptions & support — P7
| Method | Path |
|---|---|
| GET | `/subscriptions/current` · `/subscriptions/plans` |
| POST | `/subscriptions/checkout` · `/subscriptions/cancel` |
| GET/POST | `/support/tickets` · GET `/support/tickets/:id` · POST `/support/tickets/:id/messages` |
| PATCH | `/support/tickets/:id` (status, assignee — admin) |
