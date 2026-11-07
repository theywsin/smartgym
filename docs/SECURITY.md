# SmartGym 2.0 — Security

This document describes (1) the security state of the existing prototype and the immediate actions it needs, and (2) the controls SmartGym 2.0 is built with. Findings referenced as C-1, H-2 etc. are detailed in `PROJECT_AUDIT.md` §6.

---

## 1. Current prototype: risk statement

The prototype has **no server-side authentication or authorization**. Verified locally on commit `3b04e08`:

- Anyone can set the super admin password (`POST /api/installer/save-admin`) and then log in.
- Anyone can read every gym's members, coaches and plain-text passwords (`GET /api/db/members`, `/coaches`, `/tenants`) and `GET /api/platform/settings` returns the super admin password.
- Anyone can create, overwrite or delete any row in any gym.

### Immediate actions (owner)

1. If the prototype is deployed anywhere public, take it offline or apply the Phase 0 hotfix (roadmap) **today**.
2. Rotate every password that was ever stored by the prototype (super admin, gyms, coaches, members). Tell users not to reuse them elsewhere.
3. Delete `easy_installer.php` and any `install.lock`/`.env`/`db_fallback.json` from public web roots.
4. Firebase project `formal-answer-s18qq`: delete the Firestore database or set rules to deny all; restrict the web API key.
5. Rotate the Gemini API key if it was ever set on a public deployment (AI endpoints are open).

---

## 2. SmartGym 2.0 controls

### 2.1 Authentication
- Phone + OTP is primary. OTPs: 6 digits from a CSPRNG, stored as a hash, 2-minute TTL, 5 verify attempts, single use, rate limited per phone and per IP, generic responses (no user enumeration).
- Passwords (optional): argon2id (memory ≥ 19 MiB, t = 2), minimum 8 chars, checked against a common-password list.
- Web sessions: opaque random id (256-bit) in `HttpOnly; Secure; SameSite=Lax; Path=/` cookie, server-side `Session` row, idle timeout 7 days, absolute 30 days, rotated on privilege change.
- Mobile: JWT access token (15 min, `aud`/`iss` checked, EdDSA or HS256 with ≥ 256-bit secret from env) + opaque refresh token (hash stored), rotation with reuse detection revoking the token family. Tokens stored in Expo SecureStore only.
- Login-attempt protection: progressive delays and temporary lockout per account and IP (Redis counters).
- Users can list and revoke their sessions/devices.

### 2.2 Authorization and tenant isolation
- RBAC with permission strings; checks in service-layer policies, never only in the UI.
- Tenant id derives from the authenticated session only. User-supplied tenant ids are ignored except on audited super-admin routes.
- Prisma extension enforces `gym_id` on all tenant-owned models; Postgres RLS enforces it again at the DB level; the app's DB role is not the table owner and cannot bypass RLS.
- Cross-tenant resources return 404, not 403.
- Branch scoping for branch roles; coach↔athlete scoping for coaches; self-only for athletes.
- Super admin "view as gym" requires an explicit reason, is time-boxed, and is written to `AuditLog`.
- Automated tests: for each endpoint, a request from gym B for a gym A resource must fail.

### 2.3 Input, output and web security
- Zod validation of every params/query/body; unknown keys stripped.
- Prisma parameterised queries only; raw SQL only in reviewed migrations/reports with bound parameters.
- React escaping by default; no `dangerouslySetInnerHTML` except sanitised (DOMPurify) blog content.
- Security headers via Next.js middleware/Nginx: strict CSP (nonces), HSTS (preload after go-live), `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera only where QR scanning needs it), `frame-ancestors 'none'`.
- CSRF: SameSite cookies + double-submit token on mutating requests.
- CORS: allow-list (web origin only); mobile uses bearer tokens.
- Body size limits per route (JSON 1 MB default).
- Errors: generic message + `requestId`; stack traces only in server logs.

### 2.4 Files
- Uploads go to private S3-compatible buckets via server-issued presigned URLs with size limits (images 5 MB, documents 10 MB, import files 5 MB).
- MIME sniffed server-side (magic bytes) and checked against an allow-list (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`, CSV/XLSX for imports). Images re-encoded to strip EXIF/GPS.
- Progress photos and health documents are private; access through short-lived signed URLs after a permission check.

### 2.5 Sensitive data
- Health notes, national code: application-level encryption (AES-256-GCM, key from env/KMS) on top of disk encryption.
- Explicit consent recorded (`health_consent_at`) before coaches can view health data.
- AI: personal identifiers are not sent to external providers; gyms opt in to AI features; `AIRequest` logs metadata (not full prompts with PII) by default.
- Data export and deletion on request (soft delete then purge job), except financial records kept for legal retention.

### 2.6 Payments
- Gateway callbacks verified server-side with the gateway's verify API before marking paid; amounts compared with the stored expected amount.
- Idempotency keys on all money-moving endpoints; unique constraints on `(gym_id, idempotency_key)` and `(gateway, gateway_ref)`.
- Ledger is append-only; refunds and corrections are new rows.

### 2.7 Secrets and configuration
- No secrets in the repo. `.env*` ignored (except `.env.example` with empty values). Env validated at boot with Zod; the app refuses to start with missing or default secrets in production.
- SMS, payment, AI and storage credentials exist only in server env (or a secret manager); never sent to the browser or mobile app.
- Secret scanning in CI (gitleaks).

### 2.8 Rate limiting and abuse
- Nginx `limit_req` per IP as the outer layer; Redis sliding-window limits per user/route inside the app (OTP, login, AI, imports, check-in).
- AI quotas per plan, gym and user.

### 2.9 Logging, audit, monitoring
- Structured JSON logs with request id; no passwords, OTPs, tokens or full card data in logs.
- `AuditLog` (append-only, DB grants prevent UPDATE/DELETE) for auth events, permission changes, member archive, money and stock movements, settings changes, super admin actions.
- Error monitoring and uptime alerts on `/api/health`.

### 2.10 Infrastructure
- Ubuntu LTS VPS, SSH keys only, firewall (80/443/SSH), unattended security updates, fail2ban.
- Postgres and Redis not exposed publicly; separate DB roles for migrations and runtime.
- HTTPS everywhere (Let's Encrypt), TLS 1.2+.
- Containers run as non-root, read-only filesystem where possible.
- Dependency updates (Renovate/Dependabot) and `npm audit` in CI.

### 2.11 Backup and recovery
- Nightly `pg_dump` (custom format) + WAL archiving if RPO < 24 h is required; encrypted, copied off-server to object storage; 14 daily + 8 weekly retention.
- Object storage versioning for uploads.
- Restore runbook (`scripts/restore.sh`) tested monthly against staging.
- Targets: RPO ≤ 24 h (≤ 15 min with WAL), RTO ≤ 4 h.

### 2.12 Process
- Every PR: lint, typecheck, unit + integration tests, secret scan, dependency audit.
- Security review checklist (OWASP ASVS L2) before production (roadmap Phase 8).
- Destructive migrations and production changes require explicit owner approval.

## 3. Reporting a vulnerability

Report privately to the maintainers (add a security contact email here); do not open a public issue.
