/**
 * Creates a platform admin (username + password) or changes its password.
 *   npm run admin -w @smartgym/core -- <username>            asks for the password
 *   ADMIN_PASSWORD=... npm run admin -w @smartgym/core -- <username>
 * Needs the OWNER database URL (MIGRATION_DATABASE_URL or DATABASE_URL).
 */
import readline from "node:readline";
import { createPrismaClient } from "@smartgym/db";
import { upsertPlatformAdmin } from "../src/auth/sessions";

function ask(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream };
  out._writeToOutput = (s: string) => out.output.write(s.includes(q) ? s : "*");
  return new Promise((r) => rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); r(a); }));
}

async function main() {
  const username = process.argv[2];
  if (!username) { console.error("Usage: admin <username>"); process.exit(2); }
  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await ask("Password (min 10 chars): ");
    if ((await ask("Repeat password: ")) !== password) { console.error("Passwords do not match."); process.exit(1); }
  }
  const db = createPrismaClient(process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL);
  try {
    const r = await upsertPlatformAdmin(db, username, password);
    console.log(`${r.created ? "Created" : "Updated"} admin "${r.username}". Sign in at /admin/login`);
  } catch (e) {
    console.error((e as Error).message); process.exit(1);
  } finally { await db.$disconnect(); }
}
void main();
