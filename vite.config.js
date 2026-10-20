import fs from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { seo } from "./scripts/seo.mjs";

function cleanUrls() {
  const rewrite = (base, notFound) => (req, res, next) => {
    const raw = req.url || "/";
    const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    const path = raw.split("?")[0];
    if (path.length > 1 && !path.includes(".") && !/^\/(@|__|node_modules\/)/.test(path)) {
      const clean = path.replace(/\/$/, "");
      if (fs.existsSync(resolve(base, `.${clean}.html`))) req.url = `${clean}.html${q}`;
      else if (fs.existsSync(resolve(base, `.${clean}/index.html`))) req.url = `${clean}/index.html${q}`;
      else {
        notFound(req.url)
          .then((html) => {
            res.statusCode = 404;
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(html);
          })
          .catch(next);
        return;
      }
    }
    next();
  };
  return {
    name: "clean-urls",
    configureServer(server) {
      const page = resolve(__dirname, "404.html");
      server.middlewares.use(rewrite(__dirname, (url) => server.transformIndexHtml(url, fs.readFileSync(page, "utf8"))));
    },
    configurePreviewServer(server) {
      const dist = resolve(__dirname, "dist");
      server.middlewares.use(rewrite(dist, async () => fs.readFileSync(resolve(dist, "404.html"), "utf8")));
    },
  };
}

export default defineConfig({
  plugins: [seo(), cleanUrls()],
  build: {
    // Inlined fonts would ship inside the render-blocking CSS and need font-src data: in the CSP.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
    target: ["es2018", "chrome64", "safari12", "firefox68", "edge79"],
    cssTarget: ["chrome64", "safari12", "firefox68", "edge79"],
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        services: resolve(__dirname, "services.html"),
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
