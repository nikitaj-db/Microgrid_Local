import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Frontend can call `/micro/...` and Vite will forward to the backend.
      "/micro": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
    },
  },
});
