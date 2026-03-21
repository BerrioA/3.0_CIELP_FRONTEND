import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("@mui/x-charts")) {
            return "vendor-mui-charts";
          }

          if (id.includes("jspdf")) {
            return "vendor-jspdf";
          }

          if (id.includes("html2canvas")) {
            return "vendor-html2canvas";
          }

          if (
            id.includes("@mui/material") ||
            id.includes("@mui/icons-material")
          ) {
            return "vendor-mui-core";
          }

          if (id.includes("@emotion/react") || id.includes("@emotion/styled")) {
            return "vendor-emotion";
          }

          if (
            id.includes("react-router") ||
            id.includes("react-dom") ||
            id.includes("react/")
          ) {
            return "vendor-react";
          }

          if (
            id.includes("axios") ||
            id.includes("zustand") ||
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("zod")
          ) {
            return "vendor-app-libs";
          }

          return "vendor-misc";
        },
      },
    },
  },
});
