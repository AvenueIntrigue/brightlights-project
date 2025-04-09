import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    needsInterop: ["vite-express"],
    exclude: ["fsevents"],
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase from 500 kB
    cssMinify: true, // Default, but check if too aggressive
    assetsInlineLimit: 4096, // Default, adjust if images inline poorly
  },
});