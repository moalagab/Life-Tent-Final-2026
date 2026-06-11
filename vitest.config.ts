import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "src/test/setup.ts")],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    root: path.resolve(__dirname),
    pool: "forks",
    poolOptions: {
      forks: { execArgv: ["--max-old-space-size=4096"] },
    },
    minWorkers: 1,
    maxWorkers: 4,
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
