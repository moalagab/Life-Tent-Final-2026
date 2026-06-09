import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      manifest: {
        name: "Life Tent OS — نظام حياتك",
        short_name: "Life Tent",
        description: "نظام إدارة الحياة المتكامل",
        theme_color: "#1a1a2e",
        background_color: "#0f0f1a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        lang: "ar",
        dir: "rtl",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Serve index.html for all SPA navigation (fixes /admin 404 when SW serves stale cache)
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets/, /^\/api/],
        // Cache the app shell
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // Supabase API — network-first, fall back to cache
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/rest\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api-cache",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase Auth — network-only (never cache auth tokens)
            urlPattern: /^https:\/\/[a-z]+\.supabase\.co\/auth\//,
            handler: "NetworkOnly",
          },
          {
            // Static assets — cache-first
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // disable SW in dev to avoid confusion
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-slider",
          ],
          "vendor-charts": ["recharts"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-i18n": ["i18next", "react-i18next"],
          "vendor-dates": ["date-fns"],
        },
      },
    },
  },
}));
