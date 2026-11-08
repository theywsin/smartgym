/**
 * Interim client-side session for the prototype (Phase 0 hardening).
 *
 * The server issues a short-lived JWT after a real server-side password check.
 * It is kept in sessionStorage (cleared when the tab closes) and attached to
 * same-origin /api requests. SmartGym 2.0 replaces this with HttpOnly cookies.
 */
export type AuthRole = "SUPER_ADMIN" | "GYM_OWNER" | "COACH" | "MEMBER";

export interface AuthSession {
  token: string;
  role: AuthRole;
  profile?: any;
}

const KEY = "sg_auth";
export const AUTH_EXPIRED_EVENT = "sg-auth-expired";

export function getAuth(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function setAuth(session: AuthSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable (private mode): the session lasts until reload only.
  }
  memorySession = session;
}

export function clearAuth(): void {
  memorySession = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

let memorySession: AuthSession | null = null;

function currentToken(): string | null {
  return getAuth()?.token || memorySession?.token || null;
}

/** Calls the server login endpoint and stores the session on success. */
export async function login(
  kind: "admin" | "tenant" | "coach" | "member",
  username: string,
  password: string
): Promise<{ ok: boolean; session: AuthSession | null; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, username, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) {
      return { ok: false, session: null, error: data.message || data.error || "نام کاربری یا رمز عبور اشتباه است." };
    }
    const session: AuthSession = { token: data.token, role: data.role, profile: data.profile };
    setAuth(session);
    return { ok: true, session, error: "" };
  } catch {
    return { ok: false, session: null, error: "خطای ارتباط با سرور. لطفا اتصال را بررسی کنید." };
  }
}

/** Adds the Authorization header to same-origin /api requests. Call once at startup. */
export function installAuthFetch(): void {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const isApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
    const token = isApi ? currentToken() : null;
    if (!token) return originalFetch(input, init);

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
    const res = await originalFetch(input, { ...init, headers });
    if (res.status === 401 && !url.includes("/api/auth/login")) {
      clearAuth();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return res;
  };
}
