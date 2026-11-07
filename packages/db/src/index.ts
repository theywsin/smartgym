import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "./generated/prisma/client";

export * from "./generated/prisma/client";

/** A Prisma client or an interactive-transaction client. */
export type Db = PrismaClient;
export type Tx = Prisma.TransactionClient;

export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

let shared: PrismaClient | undefined;
/** Process-wide client (reused across hot reloads in development). */
export function getPrisma(): PrismaClient {
  const g = globalThis as unknown as { __smartgymPrisma?: PrismaClient };
  if (!shared) shared = g.__smartgymPrisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") g.__smartgymPrisma = shared;
  return shared;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(value: string, what: string): void {
  if (!UUID.test(value)) throw new Error(`${what} must be a UUID`);
}

type TxOptions = { timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel };

/**
 * Runs `fn` in a transaction whose row-level-security context is the given gym (and user).
 * Every tenant-owned query in a request should go through here.
 */
export async function withTenant<T>(
  db: PrismaClient,
  ctx: { gymId: string; userId?: string | null },
  fn: (tx: Tx) => Promise<T>,
  opts: TxOptions = {}
): Promise<T> {
  assertUuid(ctx.gymId, "gymId");
  if (ctx.userId) assertUuid(ctx.userId, "userId");
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.gym_id', ${ctx.gymId}, true), set_config('app.user_id', ${ctx.userId ?? ""}, true)`;
    return fn(tx);
  }, opts);
}

/** User-level context (no active gym): lets a user see their own memberships and gyms. */
export async function withUser<T>(db: PrismaClient, userId: string, fn: (tx: Tx) => Promise<T>, opts: TxOptions = {}): Promise<T> {
  assertUuid(userId, "userId");
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    return fn(tx);
  }, opts);
}

/**
 * Bypasses row-level security for platform operations (gym registration, super admin).
 * Callers must write an AuditLog entry for anything that touches tenant data.
 */
export async function withSystem<T>(db: PrismaClient, fn: (tx: Tx) => Promise<T>, opts: TxOptions = {}): Promise<T> {
  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    return fn(tx);
  }, opts);
}
