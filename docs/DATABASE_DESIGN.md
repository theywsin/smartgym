# SmartGym 2.0 — Database Design

PostgreSQL 16 · Prisma ORM · migrations in `packages/db/prisma/migrations`.

## 1. Conventions

| Rule | Detail |
|---|---|
| Primary keys | `id` — UUIDv7 (`uuid` type, time-ordered, generated server-side). Never client-generated. |
| Tenant key | Every tenant-owned table has `gym_id uuid NOT NULL REFERENCES gym(id)`; branch-scoped tables also have `branch_id`. Composite indexes start with `gym_id`. |
| Timestamps | `created_at`, `updated_at` (`timestamptz`, UTC). Display converts to Asia/Tehran + Jalali. |
| Soft delete | `deleted_at timestamptz NULL` on user-facing business entities (members, plans, products, coaches, workouts, nutrition plans). Partial unique indexes use `WHERE deleted_at IS NULL`. Financial and audit tables are **never** deleted or soft-deleted; corrections are new rows (refund, reversal). |
| Money | `bigint`, **rial**, column suffix `_amount_rial`. No `float`/`decimal` in money paths. |
| Quantities | Stock in `integer` base units; body metrics in `numeric(6,2)`. |
| Enums | Postgres enums via Prisma for closed sets (status fields). |
| Naming | snake_case tables/columns (`@@map`/`@map`), PascalCase models in Prisma. |
| RLS | Enabled on every table with `gym_id`. Policy: `gym_id = current_setting('app.gym_id')::uuid OR current_setting('app.bypass_rls', true) = 'on'`. |
| Idempotency | `idempotency_key` unique per gym on `payment`, `transaction`, `inventory_movement`, `attendance` (QR), `notification_delivery`. |

## 2. Domains and models

### 2.1 Identity and access (platform-level, not tenant-owned)

| Model | Key fields | Notes |
|---|---|---|
| `User` | phone (E.164, unique), phone_verified_at, password_hash (argon2id, nullable), status, is_super_admin, last_login_at | One person = one user across gyms |
| `UserProfile` | user_id (1:1), first_name, last_name, national_code (encrypted, nullable), birth_date, gender, avatar_file_id | |
| `Session` | user_id, kind (`WEB`/`MOBILE`), refresh_token_hash, family_id, device_name, ip, user_agent, expires_at, revoked_at, last_used_at | Device management + rotation |
| `OtpChallenge` | phone, code_hash, purpose, attempts, expires_at, consumed_at, ip | Rate limited per phone + IP |
| `Role` | key (`GYM_OWNER`…), gym_id (null = system role) | |
| `Permission` | key (`members.read`…), module_key | |
| `RolePermission` | role_id, permission_id | |

### 2.2 Tenancy and SaaS

| Model | Key fields | Notes |
|---|---|---|
| `Gym` | name, slug (unique), status (`TRIAL`/`ACTIVE`/`SUSPENDED`/`CLOSED`), owner_user_id, branding (logo_file_id, primary_color), timezone | The tenant |
| `GymMembership` | gym_id, user_id, role_id, status, invited_by | Links users to gyms with a role (= `UserRole` in brief) |
| `Branch` | gym_id, name, address, phone, manager_user_id, is_active | |
| `BranchStaff` | gym_id, branch_id, user_id, role_id | Branch-scoped access |
| `GymSetting` | gym_id, key, value jsonb | Tenant settings (AI sharing, SMS sender, …) |
| `Module` | key (`finance`, `store`, `buffet`, `ai`, …), name | Catalogue |
| `SubscriptionPlan` | name, monthly_amount_rial, annual_amount_rial, trial_days, limits jsonb (members, branches, ai_tokens) | SaaS plans |
| `SubscriptionPlanModule` | plan_id, module_id | |
| `GymSubscription` | gym_id, plan_id, status, period (`MONTHLY`/`ANNUAL`), starts_at, ends_at, trial_ends_at, cancel_at | |
| `SaasInvoice` | gym_id, subscription_id, amount_rial, status, issued_at, paid_at, payment_id | |

### 2.3 Members and memberships

| Model | Key fields |
|---|---|
| `Member` | gym_id, user_id (nullable until app activation), home_branch_id, code (unique per gym), status (`ACTIVE`/`EXPIRED`/`SUSPENDED`/`ARCHIVED`), emergency_contact jsonb, notes, deleted_at |
| `MemberNote` | gym_id, member_id, author_user_id, body, is_internal |
| `MembershipPlan` | gym_id, name, duration_days, price_amount_rial, entry_limit (nullable = unlimited), allowed_branch_ids uuid[], is_active, deleted_at |
| `MemberSubscription` | gym_id, member_id, plan_id, branch_id, status (`PENDING`/`ACTIVE`/`SUSPENDED`/`EXPIRED`/`CANCELLED`), starts_at, ends_at, entries_used, price_amount_rial, discount_amount_rial, payment_id, suspended_until |
| `Discount` | gym_id, code (unique per gym), kind (`PERCENT`/`FIXED`/`GIFT`), value, max_uses, used_count, valid_from, valid_to |
| `AthleteProfile` | gym_id, member_id, goals, fitness_level, health_notes (encrypted), health_consent_at |
| `BodyMeasurement` | gym_id, member_id, measured_at, weight_kg, body_fat_pct, chest/waist/hip/arm/thigh/neck/shoulder_cm, recorded_by |
| `ProgressPhoto` | gym_id, member_id, file_id, taken_at, visibility |

**As built (Phase 2):** `member.status` is only `ACTIVE`/`ARCHIVED`; whether a member may enter is derived from `member_subscription` (active, exhausted, suspended, upcoming, expired, none) so it can never go stale. `member.code` is a per-gym number (max + 1, unique per gym). A partial unique index allows one active member per phone per gym. `member_subscription` copies the plan's `entry_limit` and `allowed_branch_ids` at sale time, stores no `EXPIRED` status (an `ACTIVE` row past `ends_at` is expired), and has CHECK constraints on amounts and entries. Part 2 added `MemberNote` (append-only: the runtime role has no UPDATE/DELETE), `CoachProfile` (unique per gym and user) and `CoachAthlete` keyed by the coach's user id, with a partial unique index so a member has at most one current coach. Not built yet: `Discount`, `AthleteProfile`, `BodyMeasurement`, `ProgressPhoto`, `CheckinToken`, trigram search.

Indexes: `member(gym_id, status)`, `member(gym_id, code) unique`, trigram index on member name/phone for search, `member_subscription(gym_id, ends_at) WHERE status='ACTIVE'` (expiry job), `member_subscription(member_id, starts_at desc)`.

### 2.4 Attendance

| Model | Key fields |
|---|---|
| `Attendance` | gym_id, branch_id, member_id, subscription_id, checked_in_at, checked_out_at, method (`MANUAL`/`QR`), recorded_by_user_id, idempotency_key |
| `CheckinToken` | short-lived signed token (HMAC, 30–60 s) shown in the athlete app; validated server-side; only the hash is stored for replay protection |

Check-in runs in one transaction: lock the active subscription row (`SELECT … FOR UPDATE`), validate dates/branch/entry limit, increment `entries_used`, insert `Attendance`.

### 2.5 Coaching

| Model | Key fields |
|---|---|
| `CoachProfile` | gym_id, user_id, bio, specializations text[], commission_rate_bp (basis points), is_active |
| `CoachAvailability` | gym_id, coach_id, branch_id, weekday, start_time, end_time |
| `CoachAthlete` | gym_id, coach_id, member_id, started_at, ended_at |
| `Exercise` | gym_id (null = platform library), name_fa, name_en, muscle_groups text[], equipment, difficulty, media_file_id, instructions |
| `Workout` | gym_id, title, created_by, member_id (null = template), status (`DRAFT`/`PUBLISHED`/`ARCHIVED`), version, parent_version_id, source (`MANUAL`/`AI`), approved_by |
| `WorkoutDay` | workout_id, day_index, title |
| `WorkoutExercise` | workout_day_id, exercise_id, order, sets, reps, weight_kg, rest_seconds, tempo, notes |
| `WorkoutSession` | gym_id, member_id, workout_day_id, started_at, completed_at, status, client_session_id (offline recovery) |
| `WorkoutSet` | session_id, workout_exercise_id, set_number, reps, weight_kg, completed_at |
| `NutritionPlan` | gym_id, member_id, title, daily_kcal, protein_g, carbs_g, fat_g, status, version, source, approved_by |
| `Meal` | nutrition_plan_id, name, time_of_day, order |
| `MealItem` | meal_id, food_id, quantity_g |
| `Food` | gym_id (null = platform), name_fa, kcal_per_100g, protein/carbs/fat_per_100g |
| `FoodLog` | gym_id, member_id, logged_at, food_id, quantity_g, meal_slot |
| `WaterLog` | gym_id, member_id, logged_on, ml |

### 2.6 Finance

| Model | Key fields | Notes |
|---|---|---|
| `Payment` | gym_id, branch_id, member_id, amount_rial, method (`CASH`/`CARD_POS`/`ONLINE`/`TRANSFER`/`WALLET`), status (`PENDING`/`PAID`/`FAILED`/`REFUNDED`), gateway, gateway_ref, idempotency_key (unique per gym), paid_at | |
| `Transaction` | gym_id, branch_id, type (`INCOME`/`EXPENSE`/`REFUND`/`COMMISSION`/`SETTLEMENT`/`ADJUSTMENT`), amount_rial (signed), category_id, source_type, source_id, occurred_at | Append-only ledger |
| `FinanceCategory` | gym_id, name, kind |
| `Expense` | gym_id, branch_id, category_id, amount_rial, description, spent_at, attachment_file_id |
| `MemberDebt` | gym_id, member_id, amount_rial, reason, settled_at |
| `Commission` | gym_id, coach_id, source_payment_id, amount_rial, status (`ACCRUED`/`SETTLED`), settlement_id |
| `CoachSettlement` | gym_id, coach_id, period_start, period_end, total_amount_rial, paid_at |

**As built (Phase 3 part 1):** `payment` (positive amount, `refunded_amount_rial` ≤ amount; the runtime role may only INSERT and update `refunded_amount_rial`, never DELETE) and `ledger_entry` (append-only, signed amount with a CHECK per type: INCOME > 0, REFUND/EXPENSE < 0). Debt is derived: price − discount − (payments − refunds) per period, so there is no separate `MemberDebt` table to drift.

### 2.7 Store, inventory, buffet

| Model | Key fields |
|---|---|
| `ProductCategory` | gym_id, name, kind (`STORE`/`BUFFET`) |
| `Supplier` | gym_id, name, phone |
| `Product` | gym_id, category_id, sku/barcode (unique per gym), name, price_amount_rial, cost_amount_rial, min_stock, is_active, deleted_at |
| `Inventory` | gym_id, branch_id, product_id (unique per branch), quantity |
| `InventoryMovement` | gym_id, branch_id, product_id, delta, reason (`PURCHASE`/`SALE`/`RETURN`/`ADJUSTMENT`/`TRANSFER`/`BUFFET_ORDER`), reference_type, reference_id, idempotency_key, created_by |
| `Purchase` / `PurchaseItem` | supplier purchases |
| `Sale` / `SaleItem` | store sales, linked to `Payment` |
| `BuffetOrder` | gym_id, branch_id, member_id, status (`OPEN`/`PREPARING`/`SERVED`/`PAID`/`CANCELLED`), total_amount_rial, payment_id |
| `BuffetOrderItem` | order_id, product_id, quantity, unit_price_amount_rial |

`Inventory.quantity` is only changed in the same transaction that inserts an `InventoryMovement`; a check constraint prevents negative stock unless the gym enables it.

### 2.8 Engagement, support, platform

| Model | Key fields |
|---|---|
| `LoyaltyAccount` | gym_id, member_id (unique), balance |
| `LoyaltyTransaction` | gym_id, account_id, delta, reason, reference |
| `Notification` | gym_id (nullable), user_id, type, title, body, data jsonb, read_at |
| `NotificationTemplate` | gym_id (nullable), event, channel, body |
| `NotificationPreference` | user_id, event, channel, enabled |
| `NotificationDelivery` | notification_id, channel, status, provider_ref, attempts, last_error, idempotency_key |
| `SupportTicket` | gym_id (nullable), opened_by, category, status, priority, assignee_user_id |
| `SupportMessage` | ticket_id, author_user_id, body, is_internal |
| `AIRequest` | gym_id, user_id, feature, provider, model, prompt_template_version, input_tokens, output_tokens, cost_estimate, latency_ms, status, error |
| `AuditLog` | gym_id (nullable), actor_user_id, actor_role, action, entity_type, entity_id, before jsonb, after jsonb, ip, user_agent, created_at — append-only (no UPDATE/DELETE grant) |
| `FileAsset` | gym_id, owner_user_id, bucket, key, mime_type, size_bytes, sha256, visibility, created_at |
| `BlogPost` | platform CMS (carried over from prototype) |

## 3. Relationship overview

```
User ─┬─< GymMembership >── Gym ──< Branch ──< BranchStaff >── User
      └─< Session                │
                                 ├─< Member ─┬─< MemberSubscription >── MembershipPlan
                                 │           ├─< Attendance
                                 │           ├─< BodyMeasurement / ProgressPhoto
                                 │           ├─< Payment ──< Transaction
                                 │           └─< CoachAthlete >── CoachProfile ── User
                                 ├─< Workout ──< WorkoutDay ──< WorkoutExercise >── Exercise
                                 ├─< NutritionPlan ──< Meal ──< MealItem >── Food
                                 ├─< Product ──< Inventory / InventoryMovement
                                 └─< GymSubscription >── SubscriptionPlan ──< SubscriptionPlanModule >── Module
```

## 4. Seeds

- `seed.dev.ts`: two gyms (for isolation testing), branches, users for every role (OTP sandbox code), plans, members, exercises from the prototype's `src/data.ts`, foods.
- `seed.base.ts` (all environments, idempotent): roles, permissions, modules, platform exercise and food libraries, default SaaS plans. **No fake business records in production.**

## 5. Migration policy

- Every schema change is a reviewed Prisma migration; RLS policies and check constraints live in SQL migrations.
- Expand → migrate → contract for breaking changes; no destructive migration runs without a fresh backup and owner approval.
- `prisma migrate deploy` only, in a release step; `migrate reset` is disabled outside local dev by an env guard.

## 6. Legacy data mapping (if a live MySQL database exists)

| Legacy table | New model(s) | Notes |
|---|---|---|
| `tenants` | `Gym`, `User` (owner), `GymMembership`, `GymSubscription` | Plain-text password discarded; owner logs in with OTP |
| `members` | `User`, `Member`, `BodyMeasurement` (one snapshot row) | `clubId` → `gym_id`; string sizes parsed |
| `coaches` | `User`, `CoachProfile`, `GymMembership` | `clubId='all'` needs manual mapping |
| `workout_programs`, `nutrition_plans` | `Workout…`, `NutritionPlan…` | JSON blobs parsed; unparseable rows reported |
| `store_products` | `Product`, `Inventory` + opening `InventoryMovement` | `priceToman × 10` → rial |
| `attendance_records` | `Attendance` | string dates parsed as Asia/Tehran |
| `coach_sales` | `Payment` + `Commission` (historical) | |
| `tickets`, `smart_support_chats` | `SupportTicket`, `SupportMessage` | |
| `blog_posts` | `BlogPost` | |
| `platform_settings` | `GymSetting` / platform config | `admin_*` keys dropped |
