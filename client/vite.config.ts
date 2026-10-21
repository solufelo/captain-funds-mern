import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev server on 4150; /api and /socket.io are proxied to the Express API.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:4100";
  // Link scrapers need absolute og:image URLs. Netlify sets URL and Vercel
  // VERCEL_PROJECT_PRODUCTION_URL at build time (loadEnv with an empty prefix
  // also reads process.env); VITE_SITE_URL overrides both.
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL;
  const siteUrl = (env.VITE_SITE_URL || env.URL || (vercel ? `https://${vercel}` : "")).replace(/\/$/, "");
  return {
    plugins: [react(), { name: "site-url", transformIndexHtml: (html: string) => html.replaceAll("__SITE_URL__", siteUrl) }],
    server: {
      port: Number(env.PORT) || 4150,
      strictPort: true,
      // The fictional seed data lives in ../shared and is imported by the client.
      fs: { allow: [".."] },
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/socket.io": { target: apiTarget, ws: true, changeOrigin: true },
      },
    },
    preview: { port: Number(env.PORT) || 4173, strictPort: true },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
