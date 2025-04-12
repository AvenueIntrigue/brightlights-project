import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    needsInterop: ["vite-express"],
    exclude: ["fsevents"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    copyPublicDir: true, // Explicitly copy public/
    chunkSizeWarningLimit: 1000,
    cssMinify: true,
    assetsInlineLimit: 4096,
  },
});