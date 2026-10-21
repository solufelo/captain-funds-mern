import { DEMO_ACCOUNTS as SEED_ACCOUNTS } from "../../../shared/demo-seed.js";

/**
 * Browser-only demo (the static Netlify build): every API call is answered by
 * an in-browser store seeded with the same fictional data as the server.
 * Set VITE_DEMO_MODE=true to enable. Otherwise the client talks to the API.
 */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true";
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "/api";

export const DEMO_ACCOUNTS = {
  user: { email: SEED_ACCOUNTS.organiser.email, password: SEED_ACCOUNTS.organiser.password },
  admin: { email: SEED_ACCOUNTS.admin.email, password: SEED_ACCOUNTS.admin.password },
} as const;

export const REPO_URL = "https://github.com/solufelo/CAPTAIN-FUNDS-MERN";
