import { getPrisma } from "@smartgym/db";

export const dynamic = "force-dynamic";

/** Readiness: the database answers. Used by the load balancer / uptime checks. */
export async function GET() {
  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return Response.json({ status: "ok", db: "ok" });
  } catch {
    return Response.json({ status: "error", db: "unreachable" }, { status: 503 });
  }
}
