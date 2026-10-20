// Rewrites the shared shell (head, header, footer, crumbs) of every page. Safe to re-run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { t } from "../src/i18n.js";
import { PAGES, pathFor } from "./seo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tr = (key) => t("tr", key);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");

const NAV = [
  ["/services", "services", "nav.services"],
  ["/work", "work", "nav.work"],
  ["/products", "products", "nav.products"],
  ["/blog", "blog", "nav.blog"],
  ["/about", "about", "nav.about"],
  ["/contact", "contact", "nav.contact"],
];
const CRUMB = { services: "nav.services", work: "nav.work", products: "nav.products", about: "nav.about", contact: "nav.contact" };

const FONTS = "https://fonts.googleapis.com/css2?family=Manrope:wght@300..800&family=Space+Grotesk:wght@300..700&family=Geist+Mono:wght@400;500&family=Unbounded:wght@400;500;700&display=swap";

const REDIRECT = `<script>
    try {
      var s = localStorage.getItem("erst-lang"), p = location.pathname, inside = document.referrer.indexOf(location.origin + "/") === 0;
      if (s === "tr" || s === "en" || s === "fa") document.cookie = "erst-lang=" + s + "; Path=/; Max-Age=31536000; SameSite=Lax";
      if (!inside && (s === "en" || s === "fa") && !/^\\/(en|fa)(\\/|$)/.test(p)) location.replace("/" + s + (p === "/" ? "/" : p) + location.search + location.hash);
    } catch (e) {}
  </script>`;

function head(cfg) {
  const lines = [
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `<title>${tr(`meta.${cfg.meta}Title`)}</title>`,
    `<meta name="description" content="${esc(tr(`meta.${cfg.meta}Desc`))}" data-i18n-content="meta.${cfg.meta}Desc" />`,
    `<!--seo-->`,
    `<meta name="theme-color" content="#05060a" />`,
    `<meta name="color-scheme" content="dark" />`,
    `<link rel="icon" href="/favicon.svg" type="image/svg+xml" />`,
    `<link rel="icon" href="/assets/favicon.ico" sizes="32x32" />`,
    `<link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />`,
    `<link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />`,
    `<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png" />`,
    `<link rel="manifest" href="/assets/site.webmanifest" />`,
    `<link rel="preconnect" href="https://fonts.googleapis.com" />`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`,
    `<link href="${FONTS}" rel="stylesheet" />`,
    `<link rel="stylesheet" href="/src/styles.css" />`,
  ];
  if (cfg.slug !== null) lines.push(REDIRECT);
  return `<head>\n  ${lines.join("\n  ")}\n</head>`;
}

function navLinks(indent) {
  return NAV.map(([href, key, label]) => `${indent}<a href="${href}" data-nav="${key}" data-i18n="${label}">${tr(label)}</a>`).join("\n");
}

function header(cfg) {
  const slug = cfg.slug ?? "";
  const langs = [
    ["tr", "TR"],
    ["en", "EN"],
    ["fa", "فا"],
  ]
    .map(([l, label]) => `          <a href="${pathFor(slug, l)}" hreflang="${l}" lang="${l}" data-lang="${l}"${l === "tr" ? ' aria-current="true"' : ""}>${label}</a>`)
    .join("\n");
  return `<header class="site-header">
    <a class="brand" href="/" aria-label="ERST IT"><img class="brand__logo" src="/assets/logo.svg" alt="ERST IT" width="101" height="20" /></a>
    <nav class="nav" data-i18n-aria="nav.primary" aria-label="${tr("nav.primary")}">
${navLinks("      ")}
    </nav>
    <div class="tools">
      <details class="langs">
        <summary class="langs__btn">
          <span class="sr-only">Dil · Language · زبان</span>
          <span data-lang-current lang="tr">TR</span>
          <span class="langs__chev" aria-hidden="true"></span>
        </summary>
        <div class="langs__panel">
          <nav class="langs__list" aria-label="Dil · Language · زبان">
${langs}
          </nav>
        </div>
      </details>
      <a class="btn btn--ion btn--small" href="/contact" data-i18n="cta.start">${tr("cta.start")}</a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav"><span class="menu-toggle__bars" aria-hidden="true"></span><span class="sr-only" data-i18n="nav.menu">${tr("nav.menu")}</span></button>
    </div>
  </header>
  <div class="mobile-nav" id="mobile-nav" data-lenis-prevent hidden>
${navLinks("    ")}
  </div>`;
}

const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${label}</a>`;

function footer() {
  const pages = NAV.map(([href, , label]) => `          <li><a href="${href}" data-i18n="${label}">${tr(label)}</a></li>`).join("\n");
  const notes = ["wa:blog-whatsapp", "qr:blog-qr", "ex:blog-exchange"]
    .map((x) => x.split(":"))
    .map(([k, slug]) => `          <li><a href="/${slug}" data-i18n="post.${k}.title">${tr(`post.${k}.title`)}</a></li>`)
    .join("\n");
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <a class="brand" href="/" aria-label="ERST IT"><img class="brand__logo" src="/assets/logo.svg" alt="" width="101" height="20" /></a>
        <p>ERST IT Solutions Bilişim Teknolojileri Sanayi ve Ticaret Ltd. Şti.&lrm;</p>
        <address><a href="https://www.google.com/maps/search/?api=1&amp;query=41.0213,28.631" target="_blank" rel="noopener">Gökevler Mah. 2312. Sk. Burç İstanbul No: 18 J, 34522 Esenyurt / İstanbul</a></address>
      </div>
      <div>
        <h2 data-i18n="footer.pages">${tr("footer.pages")}</h2>
        <ul>
${pages}
        </ul>
      </div>
      <div>
        <h2><a href="/blog" data-i18n="nav.blog">${tr("nav.blog")}</a></h2>
        <ul>
${notes}
        </ul>
      </div>
      <div>
        <h2 data-i18n="nav.contact">${tr("nav.contact")}</h2>
        <ul>
          <li><a href="tel:+902125160983" dir="ltr">+90 212 516 09 83</a></li>
          <li><a href="mailto:info@erstitsolutions.com">info@erstitsolutions.com</a></li>
          <li>${ext("https://wa.me/905010676486", '<span dir="ltr">WhatsApp +90 501 067 64 86</span>')}</li>
        </ul>
      </div>
    </div>
    <div class="wrap legal-line">
      <p>MERSİS 0370043020200001 · Sicil 129956-5 · VKN 3700430202</p>
      <p class="fine" data-i18n="footer.privacy">${tr("footer.privacy")}</p>
      <p class="fine">© <span data-year>2026</span> ERST. <span data-i18n="footer.rights">${tr("footer.rights")}</span></p>
    </div>
    <div class="footer-word" aria-hidden="true">ERST<span>_</span></div>
  </footer>`;
}

function crumbs(key) {
  return `        <nav class="crumbs" data-i18n-aria="crumbs.label" aria-label="${tr("crumbs.label")}">
          <a href="/" data-i18n="crumbs.home">${tr("crumbs.home")}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page" data-i18n="${key}">${tr(key)}</span>
        </nav>\n`;
}

const addAttr = (html, re, attrs) =>
  html.replace(re, (tag) => {
    let out = tag;
    for (const a of attrs) if (!new RegExp(`\\s${a}(\\s|>|=)`).test(out)) out = out.replace(/>$/, ` ${a}>`);
    return out;
  });

for (const [file, cfg] of Object.entries(PAGES)) {
  const full = path.join(root, file);
  let html = fs.readFileSync(full, "utf8");

  html = html.replace(/<head>[\s\S]*?<\/head>/, head(cfg));
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(/\s*<div class="mobile-nav"[\s\S]*?<\/div>/, "");
  html = html.replace(/<header class="site-header">[\s\S]*?<\/header>/, header(cfg));
  if (/<footer class="site-footer">/.test(html)) html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer());
  else html = html.replace(/(\s*)<script type="module"/, `$1${footer()}$1<script type="module"`);
  if (!html.includes('class="skip"')) html = html.replace(/<body([^>]*)>/, `<body$1>\n  <a class="skip" href="#main" data-i18n="skip">${tr("skip")}</a>`);

  const crumbKey = CRUMB[cfg.kind];
  if (crumbKey && !html.includes('class="crumbs"')) {
    html = html.replace(/(<section class="page-hero">\s*<div class="wrap">\r?\n)/, `$1${crumbs(crumbKey)}`);
  }

  if (cfg.kind !== "home") {
    html = addAttr(html, /<h1(?![^>]*data-split)[^>]*>/g, ["data-split"]);
    html = addAttr(html, /<p class="lede"[^>]*>/g, ["data-fade"]);
    html = addAttr(html, /<(a|article) class="card"[^>]*>/g, ["data-reveal", "data-glow"]);
    html = addAttr(html, /<article class="plan[^"]*"[^>]*>/g, ["data-reveal", "data-glow"]);
    html = addAttr(html, /<a class="post"[^>]*>/g, ["data-reveal", "data-glow"]);
    html = addAttr(html, /<article class="manager"[^>]*>/g, ["data-reveal"]);
  }
  html = html.replace(/rel="noopener noreferrer"/g, 'rel="noopener"');
  html = html.replace(/(<([a-z][a-z0-9]*)\b[^>]*\sdata-i18n="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (all, open, _tag, key, _text, close) => {
    const value = tr(key);
    return value === key ? all : `${open}${String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}${close}`;
  });
  for (const [source, attr] of [["placeholder", "placeholder"], ["aria", "aria-label"], ["alt", "alt"], ["content", "content"]]) {
    html = html.replace(new RegExp(`<[a-z][^>]*\\sdata-i18n-${source}="([^"]+)"[^>]*>`, "g"), (tag, key) => {
      const value = tr(key);
      return value === key ? tag : tag.replace(new RegExp(`(\\s${attr}=")[^"]*(")`), (_m, a, b) => `${a}${esc(value)}${b}`);
    });
  }

  fs.writeFileSync(full, html);
  console.log("shell", file);
}
