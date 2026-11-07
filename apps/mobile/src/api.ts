import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/** API origin, e.g. https://app.example.ir (set EXPO_PUBLIC_API_URL at build time). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const ACCESS = "sg_access";
const REFRESH = "sg_refresh";

// Tokens live in the OS keychain/keystore. On web (dev preview only) they stay in memory.
const memory = new Map<string, string>();
const store = {
  get: (k: string) => (Platform.OS === "web" ? Promise.resolve(memory.get(k) ?? null) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === "web" ? Promise.resolve(void memory.set(k, v)) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === "web" ? Promise.resolve(void memory.delete(k)) : SecureStore.deleteItemAsync(k)),
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields?: Record<string, string[]>) {
    super(message);
  }
}

export async function hasSession() {
  return !!(await store.get(REFRESH));
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await store.set(ACCESS, accessToken);
  await store.set(REFRESH, refreshToken);
}

export async function clearTokens() {
  await store.del(ACCESS);
  await store.del(REFRESH);
}

let refreshing: Promise<boolean> | null = null;
async function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = await store.get(REFRESH);
    if (!refreshToken) return false;
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-client": "mobile" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await clearTokens();
      return false;
    }
    const { data } = await res.json();
    await saveTokens(data.accessToken, data.refreshToken);
    return true;
  })().finally(() => (refreshing = null));
  return refreshing;
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; auth?: boolean } = {}, retried = false): Promise<T> {
  const headers: Record<string, string> = { "x-client": "mobile", accept: "application/json" };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (opts.auth !== false) {
    const token = await store.get(ACCESS);
    if (token) headers.authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, { method: opts.method ?? "GET", headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  } catch {
    throw new ApiError(0, "NETWORK", "اتصال به اینترنت برقرار نیست.");
  }
  if (res.status === 401 && opts.auth !== false && !retried && (await refresh())) return api<T>(path, opts, true);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error ?? {};
    throw new ApiError(res.status, e.code ?? "INTERNAL", e.message ?? "خطای غیرمنتظره رخ داد.", e.fields);
  }
  return json?.data as T;
}

export const errorText = (e: unknown) => (e instanceof ApiError ? (e.fields ? Object.values(e.fields)[0]?.[0] ?? e.message : e.message) : "خطای غیرمنتظره رخ داد.");
