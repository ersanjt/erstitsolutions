import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        portfolio: resolve(__dirname, "portfolio.html"),
        services: resolve(__dirname, "services.html"),
        fxguard: resolve(__dirname, "fxguard.html"),
        contact: resolve(__dirname, "contact.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
});
