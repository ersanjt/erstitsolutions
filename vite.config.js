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
        blog: resolve(__dirname, "blog.html"),
        blogWhatsapp: resolve(__dirname, "blog-whatsapp.html"),
        blogQr: resolve(__dirname, "blog-qr.html"),
        blogExchange: resolve(__dirname, "blog-exchange.html"),
        notFound: resolve(__dirname, "404.html"),
      },
    },
  },
});
