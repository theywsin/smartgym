import { defineConfig } from "vitest/config";

// Root tests cover the legacy prototype only; apps/ and packages/ run their own suites.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
