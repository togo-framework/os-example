import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const port = Number(process.env.PORT) || 3000;
// Proxy the API to the Go backend so the SPA is same-origin in dev — this is what
// makes auth cookies (login/session) work. Override the target with VITE_API_PROXY.
const apiTarget = process.env.VITE_API_PROXY || "http://localhost:8080";
const proxy = {
  "/api": { target: apiTarget, changeOrigin: true, ws: true },
  "/events": { target: apiTarget, changeOrigin: true },
  "/graphql": { target: apiTarget, changeOrigin: true },
  "/docs": { target: apiTarget, changeOrigin: true },
  // Huma serves the OpenAPI document + $ref schemas at these paths; the Scalar docs
  // UI fetches /openapi.yaml — without proxying it the dev server returns index.html
  // and the docs page shows "Failed to parse OpenAPI file".
  "/openapi": { target: apiTarget, changeOrigin: true },
  "/schemas": { target: apiTarget, changeOrigin: true },
  // Autopilot board + SDK (floating launcher/feedback) are served by the API.
  "/autopilot": { target: apiTarget, changeOrigin: true },
};

// Allow the Coder workspace proxy host (…coder.fadymondy.com) to reach the dev/
// preview server. `true` accepts any Host header — fine for this private
// workspace preview; override with VITE_ALLOWED_HOSTS if you want to pin it.
const allowedHosts = process.env.VITE_ALLOWED_HOSTS
  ? process.env.VITE_ALLOWED_HOSTS.split(",")
  : true;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port, proxy, allowedHosts },
  preview: { port, proxy, allowedHosts },
});
