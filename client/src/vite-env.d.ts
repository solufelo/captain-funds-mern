/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API base URL. Defaults to "/api" (proxied to the Express server in dev). */
  readonly VITE_API_URL?: string;
  /** Socket.IO origin. Defaults to the page origin. */
  readonly VITE_SOCKET_URL?: string;
  /** "true" builds the browser-only demo (no API). */
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
