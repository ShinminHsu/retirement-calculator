import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The TWSE OpenAPI does not send CORS headers, so a browser fetch is blocked.
// Proxy quote/FX requests through the dev server (server-to-server, no CORS).
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    proxy: {
      "/proxy/twse": {
        target: "https://openapi.twse.com.tw",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/twse/, ""),
      },
      "/proxy/fx": {
        target: "https://open.er-api.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/fx/, ""),
      },
      "/proxy/stooq": {
        target: "https://stooq.com",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/stooq/, ""),
      },
      "/proxy/tpex": {
        target: "https://www.tpex.org.tw",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/proxy\/tpex/, ""),
      },
    },
  },
});
