import { defineConfig, devices } from "@playwright/test";

// Same smoke test against the static browser-only demo build (what Netlify
// serves): no API, fictional data in localStorage, mock payments.
const WEB_PORT = 4161;
process.env.E2E_DEMO = "1";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium-demo", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npx vite build --mode demo --outDir dist-demo --logLevel warn && npx vite preview --outDir dist-demo --port ${WEB_PORT} --strictPort`,
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
