/** Netlify demo runs without Express/Mongo — use in-browser store unless API URL is set. */
export function isDemoMode(): boolean {
  const flag = import.meta.env.VITE_DEMO_MODE
  if (flag === 'true') return true
  if (flag === 'false') return false
  const api = import.meta.env.VITE_API_URL
  return !api || api.includes('localhost')
}

export const DEMO_ACCOUNTS = {
  user: { email: 'demo@captainfunds.app', password: 'demo123' },
  admin: { email: 'admin@captainfunds.app', password: 'admin123' },
} as const
