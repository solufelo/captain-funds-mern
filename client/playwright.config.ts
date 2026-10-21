import { defineConfig, devices } from "@playwright/test";

// Starts the real stack for the smoke test: the Express API on an in-memory
// MongoDB (seeded with the fictional demo data) and the built client.
const API_PORT = 4120;
const WEB_PORT = 4160;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
  webServer: [
    {
      // Run from server/ so mongodb-memory-server finds its cached binary there.
      command: "node index.js",
      cwd: "../server",
      url: `http://localhost:${API_PORT}/api/health`,
      reuseExistingServer: false,
      timeout: 60_000,
      env: {
        PORT: String(API_PORT),
        MONGO_MEMORY_PORT: "4192",
        MONGODB_URL: "",
        STRIPE_SECRET_KEY: "",
        CLIENT_URL: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      // A production build served by `vite preview` (which reuses the /api
      // proxy), so the test sees what ships and never races dev-server reloads.
      command: `npx vite build --logLevel warn && npx vite preview --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}`, VITE_DEMO_MODE: "false" },
    },
  ],
});
