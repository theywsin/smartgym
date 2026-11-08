import { defineConfig } from "prisma/config";

// Migrations run as the schema OWNER role (MIGRATION_DATABASE_URL); the app runs as a
// non-owner role (DATABASE_URL) so Postgres row-level security applies to it.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  },
});
