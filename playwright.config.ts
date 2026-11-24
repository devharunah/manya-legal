import { defineConfig, devices } from "@playwright/test";

const isCI = Boolean(process.env["CI"]);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3000",
  },
  webServer: {
    command: "pnpm build && pnpm start",
    // Voice uses the fixture in e2e, even when .env.local holds a real key, so
    // tests don't spend free-tier credits or depend on the network. Caveat:
    // locally, an already-running server on :3000 is reused as-is, without
    // this variable. Stop your dev server before `pnpm e2e`.
    env: { E2E_MOCK_VOICE: "1" },
    url: "http://127.0.0.1:3000",
    timeout: 180_000,
    reuseExistingServer: !isCI,
  },
});
