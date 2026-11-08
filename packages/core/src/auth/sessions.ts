import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { Session, SessionKind, User } from "@smartgym/db";
import { withUser, withSystem } from "@smartgym/db";
import { AppError } from "../errors";
import { type CoreDeps, nowOf } from "../deps";
import { randomToken, sha256, hashPassword, verifyPassword } from "./crypto";

export interface ClientMeta {
  ip?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

const LAST_USED_RESOLUTION_MS = 5 * 60 * 1000;
const ISSUER = "smartgym";
const AUDIENCE = "smartgym-mobile";

function expired(): AppError {
  return new AppError("SESSION_EXPIRED", "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.");
}

/** Creates a session. For WEB the token is the cookie value; for MOBILE it is the refresh token. */
export async function createSession(
  deps: CoreDeps,
  input: { userId: string; kind: SessionKind; familyId?: string; activeGymId?: string | null } & ClientMeta
): Promise<{ session: Session; token: string }> {
  const now = nowOf(deps);
  const token = randomToken();
  const session = await deps.db.session.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      tokenHash: sha256(token),
      familyId: input.familyId ?? crypto.randomUUID(),
      activeGymId: input.activeGymId ?? null,
      ip: input.ip ?? null,
      userAgent: input.userAgent?.slice(0, 400) ?? null,
      deviceName: input.deviceName ?? null,
      expiresAt: new Date(now.getTime() + deps.config.sessionAbsoluteSeconds * 1000),
    },
  });
  return { session, token };
}

/** Resolves a web session cookie. Enforces absolute and idle expiry. */
export async function authenticateWebSession(deps: CoreDeps, token: string): Promise<{ session: Session; user: User }> {
  if (!token || token.length > 200) throw expired();
  const now = nowOf(deps);
  const session = await deps.db.session.findUnique({ where: { tokenHash: sha256(token) }, include: { user: true } });
  if (!session || (session.kind !== "WEB" && session.kind !== "ADMIN") || session.revokedAt || session.expiresAt <= now) throw expired();
  if (now.getTime() - session.lastUsedAt.getTime() > deps.config.webSessionIdleSeconds * 1000) {
    await deps.db.session.update({ where: { id: session.id }, data: { revokedAt: now } });
    throw expired();
  }
  if (session.user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این حساب کاربری غیرفعال شده است.");
  if (now.getTime() - session.lastUsedAt.getTime() > LAST_USED_RESOLUTION_MS) {
    await deps.db.session.update({ where: { id: session.id }, data: { lastUsedAt: now } });
  }
  const { user, ...rest } = session;
  return { session: rest, user };
}

function jwtKey(deps: CoreDeps): Uint8Array {
  return new TextEncoder().encode(deps.config.jwtSecret);
}

export async function issueAccessToken(deps: CoreDeps, session: Pick<Session, "id" | "userId">): Promise<string> {
  const now = Math.floor(nowOf(deps).getTime() / 1000);
  return new SignJWT({ sid: session.id })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt(now)
    .setExpirationTime(now + deps.config.accessTokenTtlSeconds)
    .sign(jwtKey(deps));
}

/** Verifies a mobile access token and that its session is still live (so logout is immediate). */
export async function authenticateAccessToken(deps: CoreDeps, token: string): Promise<{ session: Session; user: User }> {
  let sid: string;
  try {
    const { payload } = await jwtVerify(token, jwtKey(deps), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
      currentDate: nowOf(deps),
    });
    if (typeof payload.sid !== "string") throw new Error("no sid");
    sid = payload.sid;
  } catch {
    throw expired();
  }
  const session = await deps.db.session.findUnique({ where: { id: sid }, include: { user: true } });
  if (!session || session.revokedAt || session.expiresAt <= nowOf(deps)) throw expired();
  if (session.user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این حساب کاربری غیرفعال شده است.");
  const { user, ...rest } = session;
  return { session: rest, user };
}

/**
 * Rotates a mobile refresh token. Re-use of an already rotated token means it leaked,
 * so the whole token family (every device session derived from that login) is revoked.
 */
export async function rotateRefreshToken(
  deps: CoreDeps,
  refreshToken: string,
  meta: ClientMeta = {}
): Promise<{ accessToken: string; refreshToken: string; session: Session }> {
  const now = nowOf(deps);
  const current = await deps.db.session.findUnique({ where: { tokenHash: sha256(refreshToken) } });
  if (!current || current.kind !== "MOBILE") throw expired();

  if (current.revokedAt || current.replacedById) {
    await deps.db.session.updateMany({ where: { familyId: current.familyId, revokedAt: null }, data: { revokedAt: now } });
    throw expired();
  }
  if (current.expiresAt <= now) throw expired();

  const next = await createSession(deps, {
    userId: current.userId,
    kind: "MOBILE",
    familyId: current.familyId,
    activeGymId: current.activeGymId,
    ip: meta.ip ?? current.ip,
    userAgent: meta.userAgent ?? current.userAgent,
    deviceName: current.deviceName,
  });
  // Only one concurrent rotation of the same token may win.
  const won = await deps.db.session.updateMany({
    where: { id: current.id, revokedAt: null, replacedById: null },
    data: { revokedAt: now, replacedById: next.session.id },
  });
  if (won.count === 0) {
    await deps.db.session.updateMany({ where: { familyId: current.familyId, revokedAt: null }, data: { revokedAt: now } });
    throw expired();
  }
  return { accessToken: await issueAccessToken(deps, next.session), refreshToken: next.token, session: next.session };
}

export async function revokeSession(deps: CoreDeps, userId: string, sessionId: string): Promise<void> {
  const res = await deps.db.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: nowOf(deps) },
  });
  if (res.count === 0) throw new AppError("NOT_FOUND", "نشست یافت نشد.");
}

export async function listSessions(deps: CoreDeps, userId: string) {
  return deps.db.session.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: nowOf(deps) } },
    orderBy: { lastUsedAt: "desc" },
    select: { id: true, kind: true, deviceName: true, ip: true, userAgent: true, createdAt: true, lastUsedAt: true },
  });
}

/** Switches the gym a session works in, after checking the user is an active member. */
export async function setActiveGym(deps: CoreDeps, session: Pick<Session, "id" | "userId">, gymId: string): Promise<void> {
  const membership = await withUser(deps.db, session.userId, (tx) =>
    tx.gymMembership.findFirst({ where: { userId: session.userId, gymId, status: "ACTIVE" }, select: { id: true } })
  );
  if (!membership) throw new AppError("FORBIDDEN", "شما عضو این باشگاه نیستید.");
  await deps.db.session.update({ where: { id: session.id }, data: { activeGymId: gymId } });
}

export async function setPassword(deps: CoreDeps, userId: string, password: string): Promise<void> {
  await deps.db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password) } });
}

/** Password login (optional per user). Same error for unknown phone and wrong password. */
let dummyHash: Promise<string> | undefined;

export async function loginWithPassword(deps: CoreDeps, phone: string, password: string): Promise<User> {
  const user = await deps.db.user.findUnique({ where: { phone } });
  dummyHash ??= hashPassword("smartgym-timing-equaliser");
  // Always run one argon2 verification so response time doesn't reveal whether the phone exists.
  const ok = await verifyPassword(user?.passwordHash ?? (await dummyHash), password) && !!user?.passwordHash;
  if (!user || !ok) throw new AppError("UNAUTHENTICATED", "شماره موبایل یا رمز عبور نادرست است.");
  if (user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این حساب کاربری غیرفعال شده است.");
  return deps.db.user.update({ where: { id: user.id }, data: { lastLoginAt: nowOf(deps) } });
}

// ───────── Platform admin panel: username + password ─────────

const ADMIN_USERNAME = /^[a-z0-9_.-]{3,32}$/;
const adminFail = () => new AppError("UNAUTHENTICATED", "نام کاربری یا رمز عبور نادرست است.");

/**
 * Signs a platform admin in with username and password. Only accounts created with the
 * admin CLI (isSuperAdmin + adminUsername) can use it. Same error and timing for every failure.
 */
export async function loginAdmin(deps: CoreDeps, username: string, password: string): Promise<User> {
  const name = username.trim().toLowerCase();
  const user = ADMIN_USERNAME.test(name) ? await deps.db.user.findUnique({ where: { adminUsername: name } }) : null;
  dummyHash ??= hashPassword("smartgym-timing-equaliser");
  const ok = (await verifyPassword(user?.passwordHash ?? (await dummyHash), password)) && !!user?.passwordHash;
  if (!user || !ok || !user.isSuperAdmin) throw adminFail();
  if (user.status !== "ACTIVE") throw new AppError("FORBIDDEN", "این حساب کاربری غیرفعال شده است.");
  await withSystem(deps.db, (tx) => tx.auditLog.create({ data: { actorUserId: user.id, actorRole: "SUPER_ADMIN", action: "platform.admin_login", entityType: "user", entityId: user.id } }));
  return deps.db.user.update({ where: { id: user.id }, data: { lastLoginAt: nowOf(deps) } });
}

/**
 * Creates or updates a platform admin account (CLI only, never exposed over HTTP).
 * The account is not a gym user: its phone column holds an "admin:" marker that can never pass
 * mobile-number validation, so it cannot sign in with OTP.
 */
export async function upsertPlatformAdmin(db: CoreDeps["db"], username: string, password: string) {
  const name = username.trim().toLowerCase();
  if (!ADMIN_USERNAME.test(name)) throw new Error("Username: 3-32 chars, a-z 0-9 _ . -");
  if (password.length < 10) throw new Error("Password must be at least 10 characters.");
  const passwordHash = await hashPassword(password);
  const existing = await db.user.findUnique({ where: { adminUsername: name } });
  const user = existing
    ? await db.user.update({ where: { id: existing.id }, data: { passwordHash, isSuperAdmin: true, status: "ACTIVE" } })
    : await db.user.create({ data: { phone: `admin:${name}`, adminUsername: name, passwordHash, isSuperAdmin: true } });
  // Changing the password signs out every open admin session.
  await db.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await db.auditLog.create({ data: { actorRole: "CLI", action: existing ? "platform.admin_password" : "platform.admin_create", entityType: "user", entityId: user.id } });
  return { id: user.id, username: name, created: !existing };
}
