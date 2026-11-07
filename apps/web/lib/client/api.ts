"use client";

/** Typed fetch wrapper for the SmartGym REST API (web: cookie session + CSRF header). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>
  ) {
    super(message);
  }
}

function csrfToken(): string | undefined {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith("sg_csrf="))
    ?.split("=")[1];
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; csv?: string; idempotencyKey?: string } = {}): Promise<T> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body !== undefined) headers["Content-Type"] = "application/json";
  if (init.csv !== undefined) headers["Content-Type"] = "text/csv; charset=utf-8";
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;
  if (method !== "GET") {
    const token = csrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      headers,
      body: init.csv !== undefined ? init.csv : init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(0, "OFFLINE", "اتصال به اینترنت برقرار نیست.");
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? "INTERNAL", e?.message ?? "خطای غیرمنتظره‌ای رخ داد.", e?.fields);
  }
  return json?.data as T;
}

export interface Me {
  user: { id: string; phone: string; firstName: string | null; lastName: string | null; hasPassword: boolean; isSuperAdmin: boolean };
  gyms: { id: string; name: string; slug: string; status: string; roles: string[] }[];
  activeGymId: string | null;
  access: {
    gymId: string;
    roles: string[];
    permissions: string[];
    branchIds: string[] | null;
    modules: string[];
    gymStatus: string;
  } | null;
}
