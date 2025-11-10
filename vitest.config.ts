import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": join(rootDir, "."),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    coverage: {
      provider: "v8",
    },
    css: true,
    passWithNoTests: true,
  },
});

