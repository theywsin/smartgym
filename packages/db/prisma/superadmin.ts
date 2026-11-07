/**
 * Grants or revokes platform super admin. Server-side only; there is no API for this.
 *   npm run superadmin -w @smartgym/db -- +989121234567          grant
 *   npm run superadmin -w @smartgym/db -- +989121234567 --revoke revoke
 * The user must have signed in once (OTP) so the account exists.
 */
import { createPrismaClient, withSystem } from "../src/index";

async function main() {
  const [phone, flag] = process.argv.slice(2);
  if (!phone || !/^\+989\d{9}$/.test(phone)) {
    console.error("Usage: superadmin <+989xxxxxxxxx> [--revoke]");
    process.exit(2);
  }
  const grant = flag !== "--revoke";
  const db = createPrismaClient(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL);
  try {
    const done = await withSystem(db, async (tx) => {
      const user = await tx.user.findUnique({ where: { phone }, select: { id: true } });
      if (!user) return null;
      await tx.user.update({ where: { id: user.id }, data: { isSuperAdmin: grant } });
      await tx.auditLog.create({ data: { actorRole: "CLI", action: grant ? "platform.superadmin_grant" : "platform.superadmin_revoke", entityType: "user", entityId: user.id } });
      return user.id;
    });
    if (!done) {
      console.error("No user with that phone. Sign in once with OTP first.");
      process.exit(1);
    }
    console.log(`${grant ? "Granted" : "Revoked"} super admin for ${phone}`);
  } finally {
    await db.$disconnect();
  }
}
void main();
