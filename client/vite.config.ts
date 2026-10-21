import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Dev server on 4150; /api and /socket.io are proxied to the Express API.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const apiTarget = env.API_PROXY_TARGET || "http://localhost:4100";
  return {
    plugins: [react()],
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
            antd: ["antd", "@ant-design/icons"],
            charts: ["recharts"],
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
