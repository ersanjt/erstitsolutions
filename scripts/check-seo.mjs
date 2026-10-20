// Audits dist/: meta lengths, canonical/hreflang, JSON-LD, h1, internal links, missing translations.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";
import { dict } from "../src/i18n.js";
import { HREFLANG, ORIGIN, PAGES, localeRedirect, pathFor } from "./seo.mjs";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const files = [];
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
  const p = path.join(dir, d.name);
  if (d.isDirectory()) walk(p);
  else if (d.name.endsWith(".html")) files.push(p);
});
walk(dist);

const exists = (href) => {
  const clean = href.split(/[?#]/)[0];
  if (clean === "/" || clean.endsWith("/")) return fs.existsSync(path.join(dist, clean, "index.html"));
  return fs.existsSync(path.join(dist, clean)) || fs.existsSync(path.join(dist, `${clean}.html`));
};

let problems = 0;
const report = (file, msg) => {
  problems++;
  console.log(`✗ ${path.relative(dist, file)}: ${msg}`);
};
const external = new Set();

for (const file of files) {
  const { document } = parseHTML(fs.readFileSync(file, "utf8"));
  const rel = path.relative(dist, file).replace(/\\/g, "/");
  const lang = document.documentElement.getAttribute("lang");
  const title = document.querySelector("title")?.textContent || "";
  const desc = document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const noindex = /noindex/.test(document.querySelector('meta[name="robots"]')?.getAttribute("content") || "");

  if (!title) report(file, "no title");
  if (title.length > 65) report(file, `title ${title.length} chars`);
  if (!noindex && (desc.length < 70 || desc.length > 170)) report(file, `description ${desc.length} chars`);
  const h1 = document.querySelectorAll("h1").length;
  if (h1 !== 1) report(file, `${h1} h1`);
  const expectLang = rel.startsWith("en/") ? "en" : rel.startsWith("fa/") ? "fa" : "tr";
  if (lang !== expectLang) report(file, `lang=${lang}`);

  if (!noindex) {
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    const slug = path.basename(rel, ".html") === "index" ? "" : path.basename(rel, ".html");
    const want = ORIGIN + pathFor(slug, expectLang);
    if (canonical !== want) report(file, `canonical ${canonical} != ${want}`);
    const alts = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    for (const [code, l] of HREFLANG) {
      const href = alts.find((n) => n.getAttribute("hreflang") === code)?.getAttribute("href");
      const expected = ORIGIN + pathFor(slug, l);
      if (href !== expected) report(file, `hreflang ${code} ${href} != ${expected}`);
    }
    document.querySelectorAll("a[data-lang]").forEach((a) => {
      const l = a.getAttribute("data-lang");
      const href = a.getAttribute("href");
      const wantHref = pathFor(slug, l);
      if (href !== wantHref) report(file, `lang link ${l} ${href} != ${wantHref}`);
    });
    const ld = document.querySelector('script[type="application/ld+json"]');
    try {
      const data = JSON.parse(ld.textContent);
      if (!data["@graph"]?.length) report(file, "empty graph");
    } catch (e) {
      report(file, `JSON-LD ${e.message}`);
    }
  }

  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (href.startsWith("http")) {
      external.add(href);
      if (a.getAttribute("target") === "_blank" && !/noopener/.test(a.getAttribute("rel") || "")) report(file, `no noopener ${href}`);
      return;
    }
    if (!href.startsWith("/")) return;
    if (/\.html(?:$|[?#])/.test(href)) report(file, `html link ${href}`);
    if (!exists(href)) report(file, `broken ${href}`);
    if (expectLang !== "tr" && !a.hasAttribute("data-lang") && !href.startsWith(`/${expectLang}/`) && !href.startsWith("/assets/")) report(file, `unlocalized ${href}`);
  });

  if (expectLang !== "tr") {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!(key in dict[expectLang])) report(file, `missing ${expectLang} key ${key}`);
    });
  }
  document.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt")) report(file, `img without alt ${img.getAttribute("src")}`);
  });
}

const xml = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
for (const [file, cfg] of Object.entries(PAGES)) {
  if (cfg.slug === null) continue;
  for (const lang of ["tr", "en", "fa"]) {
    const loc = `${ORIGIN}${pathFor(cfg.slug, lang)}`;
    if (!xml.includes(`<loc>${loc}</loc>`)) report(file, `sitemap missing ${loc}`);
    for (const [code, l] of HREFLANG) {
      const alt = `${ORIGIN}${pathFor(cfg.slug, l)}`;
      if (!xml.includes(`hreflang="${code}" href="${alt}"`)) report(file, `sitemap hreflang ${code} for ${loc}`);
    }
  }
}

const geoCases = [
  [{ pathname: "/", country: "IR" }, "/fa/"],
  [{ pathname: "/services", country: "DE" }, "/en/services"],
  [{ pathname: "/", country: "TR" }, null],
  [{ pathname: "/", country: "US", ua: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }, null],
  [{ pathname: "/services", country: "US", cookie: "erst-lang=tr" }, null],
  [{ pathname: "/", country: "TR", cookie: "erst-lang=fa" }, "/fa/"],
  [{ pathname: "/en/services", country: "IR" }, null],
  [{ pathname: "/assets/logo.svg", country: "DE" }, null],
  [{ pathname: "/", country: "" }, null],
  [{ pathname: "/blog-qr", country: "AF" }, "/fa/blog-qr"],
  [{ pathname: "/services.html", country: "GB" }, "/en/services"],
];
for (const [input, want] of geoCases) {
  const got = localeRedirect(input);
  if (got !== want) {
    problems++;
    console.log(`✗ geo ${JSON.stringify(input)} → ${got} != ${want}`);
  }
}

console.log(`\n${files.length} pages, ${problems} problems`);
console.log(`external links:\n  ${[...external].sort().join("\n  ")}`);
