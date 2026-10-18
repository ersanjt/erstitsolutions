import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        about: resolve(__dirname, "about.html"),
        work: resolve(__dirname, "work.html"),
        products: resolve(__dirname, "products.html"),
        contact: resolve(__dirname, "contact.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
});
