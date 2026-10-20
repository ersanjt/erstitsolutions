import fs from "node:fs";
import path from "node:path";
import { parseHTML } from "linkedom";
import { t } from "../src/i18n.js";
import { translate, LOCALES } from "../src/translate.js";

export const ORIGIN = "https://erstitsolutions.com";
const LANGS = ["tr", "en", "fa"];
const UPDATED = "2026-10-20";
const OG = { url: `${ORIGIN}/assets/og.png`, width: 1200, height: 630 };
const GEO = { lat: 41.0213, lng: 28.631 };
const ORG = `${ORIGIN}/#organization`;
const SITE = `${ORIGIN}/#website`;
const BCP = { tr: "tr-TR", en: "en", fa: "fa" };

// One URL per language. Region codes point at that same URL.
// x-default is English: the version Geo IP serves outside Türkiye, Iran and Afghanistan.
export const HREFLANG = [
  ["tr", "tr"],
  ["tr-TR", "tr"],
  ["en", "en"],
  ["fa", "fa"],
  ["fa-IR", "fa"],
  ["fa-AF", "fa"],
  ["x-default", "en"],
];

const AREAS = [
  { "@type": "Country", name: "Türkiye" },
  { "@type": "Country", name: "Iran" },
  { "@type": "Country", name: "Afghanistan" },
  { "@type": "Place", name: "Worldwide" },
];

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|headless|inspectiontool|mediapartners/i;
const ASSET = /^\/(assets\/|src\/|favicon\.svg|sitemap\.xml|robots\.txt|llms\.txt|@|node_modules\/)/;

export function geoLang(country) {
  const code = String(country || "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "TR" || code === "XX" || code === "T1") return null;
  if (code === "IR" || code === "AF") return "fa";
  return "en";
}

export function localeRedirect({ pathname, cookie = "", ua = "", country = "" }) {
  if (pathname === "/404" || pathname === "/404.html") return null;
  let path = pathname;
  if (/\/index\.html$/.test(path)) path = path.slice(0, -"index.html".length) || "/";
  else if (path.endsWith(".html")) path = path.slice(0, -5) || "/";
  if (ASSET.test(path) || BOT.test(ua)) return null;
  if (/^\/(en|fa)(\/|$)/.test(path)) return null;
  const saved = /(?:^|;\s*)erst-lang=(tr|en|fa)(?:\s*;|$)/i.exec(cookie)?.[1]?.toLowerCase();
  const target = saved === "en" || saved === "fa" ? saved : saved === "tr" ? null : geoLang(country);
  if (!target) return null;
  return `/${target}${path === "/" ? "/" : path}`;
}

const POSTS = ["wa", "qr", "ex"];
const POST_SLUG = { wa: "blog-whatsapp", qr: "blog-qr", ex: "blog-exchange" };

export const PAGES = {
  "index.html": { slug: "", kind: "home", meta: "home" },
  "services.html": { slug: "services", kind: "services", meta: "services", crumbs: ["nav.services"] },
  "work.html": { slug: "work", kind: "work", meta: "work", crumbs: ["nav.work"] },
  "products.html": { slug: "products", kind: "products", meta: "products", crumbs: ["nav.products"] },
  "about.html": { slug: "about", kind: "about", meta: "about", crumbs: ["nav.about"] },
  "contact.html": { slug: "contact", kind: "contact", meta: "contact", crumbs: ["nav.contact"] },
  "blog.html": { slug: "blog", kind: "blog", meta: "blog", crumbs: ["nav.blog"] },
  "blog-whatsapp.html": { slug: "blog-whatsapp", kind: "post", post: "wa", meta: "wa", crumbs: ["nav.blog", "post.wa.title"] },
  "blog-qr.html": { slug: "blog-qr", kind: "post", post: "qr", meta: "qr", crumbs: ["nav.blog", "post.qr.title"] },
  "blog-exchange.html": { slug: "blog-exchange", kind: "post", post: "ex", meta: "ex", crumbs: ["nav.blog", "post.ex.title"] },
  "404.html": { slug: null, kind: "404", meta: "notFound" },
};

const PUBLISHED = { wa: "2026-10-18", qr: "2026-10-18", ex: "2026-10-18" };

export function pathFor(slug, lang) {
  const prefix = lang === "tr" ? "" : `/${lang}`;
  return slug ? `${prefix}/${slug}` : `${prefix}/`;
}

const urlFor = (slug, lang) => ORIGIN + pathFor(slug, lang);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${esc(value)}" />`;

function organization(lang) {
  return {
    "@type": "ProfessionalService",
    "@id": ORG,
    name: "ERST IT Solutions",
    legalName: "ERST IT Solutions Bilişim Teknolojileri Sanayi ve Ticaret Ltd. Şti.",
    alternateName: ["ERST IT", "ERST"],
    description: t(lang, "meta.homeDesc"),
    url: `${ORIGIN}/`,
    logo: { "@type": "ImageObject", url: `${ORIGIN}/assets/android-chrome-512x512.png`, width: 512, height: 512 },
    image: OG.url,
    email: "info@erstitsolutions.com",
    telephone: "+902125160983",
    foundingDate: "2018-03-19",
    taxID: "3700430202",
    identifier: [
      { "@type": "PropertyValue", propertyID: "MERSIS", value: "0370043020200001" },
      { "@type": "PropertyValue", propertyID: "Ticaret Sicil No", value: "129956-5" },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Gökevler Mah. 2312. Sk. Burç İstanbul 18 Blok No: 18 J İç Kapı No: 199",
      postalCode: "34522",
      addressLocality: "Esenyurt",
      addressRegion: "İstanbul",
      addressCountry: "TR",
    },
    geo: { "@type": "GeoCoordinates", latitude: GEO.lat, longitude: GEO.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${GEO.lat},${GEO.lng}`,
    areaServed: AREAS,
    knowsAbout: list(t(lang, "kw.org")),
    knowsLanguage: ["tr", "en", "fa"],
    contactPoint: [
      { "@type": "ContactPoint", contactType: "customer service", telephone: "+902125160983", email: "info@erstitsolutions.com", availableLanguage: ["Turkish", "English", "Persian"] },
      { "@type": "ContactPoint", contactType: "sales", telephone: "+905010676486", availableLanguage: ["Turkish", "English", "Persian"] },
    ],
  };
}

const PRODUCT = `${ORIGIN}/products#crm`;

function product(lang) {
  return {
    "@type": "SoftwareApplication",
    "@id": PRODUCT,
    name: t(lang, "prod.crm.title"),
    description: t(lang, "prod.crm.text"),
    url: `${urlFor("products", lang)}#crm`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    inLanguage: ["en", "tr", "fa", "ar", "ru"],
    offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: "49", highPrice: "499", url: urlFor("products", lang) },
    author: { "@id": ORG },
    publisher: { "@id": ORG },
  };
}

function breadcrumb(cfg, lang, url) {
  const items = [{ name: t(lang, "crumbs.home"), item: urlFor("", lang) }];
  (cfg.crumbs || []).forEach((key, i, all) => {
    const last = i === all.length - 1;
    items.push({ name: t(lang, key), item: last ? url : urlFor(key === "nav.blog" ? "blog" : cfg.slug, lang) });
  });
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: items.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.name, item: x.item })),
  };
}

function graph(file, lang) {
  const cfg = PAGES[file];
  const url = urlFor(cfg.slug, lang);
  const title = t(lang, `meta.${cfg.meta}Title`);
  const desc = t(lang, `meta.${cfg.meta}Desc`);
  const pageType = { home: "WebPage", about: "AboutPage", contact: "ContactPage", blog: "CollectionPage", products: "CollectionPage" }[cfg.kind] || "WebPage";

  const page = {
    "@type": pageType,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description: desc,
    inLanguage: BCP[lang],
    isPartOf: { "@id": SITE },
    about: { "@id": ORG },
    primaryImageOfPage: { "@type": "ImageObject", url: OG.url, width: OG.width, height: OG.height },
    dateModified: UPDATED,
    workTranslation: LANGS.filter((l) => l !== lang).map((l) => ({ "@id": `${urlFor(cfg.slug, l)}#webpage` })),
  };
  const nodes = [
    organization(lang),
    { "@type": "WebSite", "@id": SITE, url: `${ORIGIN}/`, name: "ERST IT Solutions", alternateName: "ERST", inLanguage: ["tr-TR", "en", "fa"], publisher: { "@id": ORG } },
    page,
  ];
  if (cfg.crumbs) {
    page.breadcrumb = { "@id": `${url}#breadcrumb` };
    nodes.push(breadcrumb(cfg, lang, url));
  }

  if (cfg.kind === "home") {
    const entries = ["services", "work", "products", "blog", "about", "contact"];
    page.mainEntity = { "@id": `${url}#sections` };
    nodes.push({
      "@type": "ItemList",
      "@id": `${url}#sections`,
      itemListElement: entries.map((slug, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: t(lang, `nav.${slug}`),
        url: urlFor(slug, lang),
      })),
    });
  }

  if (cfg.kind === "services") {
    ["ai", "prod", "web", "mobile", "auto", "crm", "erp", "server", "net", "care"].forEach((k) => {
      nodes.push({
        "@type": "Service",
        "@id": `${urlFor("services", lang)}#${k}`,
        name: t(lang, `svc.${k}.title`),
        serviceType: t(lang, `svc.${k}.type`),
        description: t(lang, `svc.${k}.text`),
        provider: { "@id": ORG },
        areaServed: AREAS,
        url: `${urlFor("services", lang)}#${k}`,
      });
    });
    nodes.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage: BCP[lang],
      mainEntity: [1, 2, 3, 4, 5, 6, 7].map((n) => ({
        "@type": "Question",
        name: t(lang, `faq.${n}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(lang, `faq.${n}.a`) },
      })),
    });
  }

  if (cfg.kind === "work") {
    page.about = { "@id": PRODUCT };
    nodes.push(product(lang));
  }

  if (cfg.kind === "products") {
    page.mainEntity = { "@id": `${url}#products` };
    nodes.push({
      "@type": "ItemList",
      "@id": `${url}#products`,
      itemListElement: [
        product(lang),
        {
          "@type": "SoftwareApplication",
          name: t(lang, "prod.books.title"),
          description: t(lang, "prod.books.text"),
          url: `${urlFor("products", lang)}#books`,
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          publisher: { "@id": ORG },
        },
        {
          "@type": "Service",
          name: t(lang, "prod.web.title"),
          description: t(lang, "prod.web.text"),
          url: `${urlFor("products", lang)}#sites`,
          provider: { "@id": ORG },
        },
      ].map((item, i) => ({ "@type": "ListItem", position: i + 1, item })),
    });
  }

  if (cfg.kind === "blog") {
    nodes.push({
      "@type": "Blog",
      "@id": `${url}#blog`,
      url,
      name: t(lang, "meta.blogTitle"),
      inLanguage: BCP[lang],
      publisher: { "@id": ORG },
      blogPost: POSTS.map((p) => ({
        "@type": "BlogPosting",
        headline: t(lang, `post.${p}.title`),
        url: urlFor(POST_SLUG[p], lang),
        datePublished: PUBLISHED[p],
      })),
    });
  }

  if (cfg.kind === "post") {
    page["@type"] = "WebPage";
    nodes.push({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: t(lang, `post.${cfg.post}.title`),
      description: desc,
      abstract: t(lang, `post.${cfg.post}.excerpt`),
      datePublished: PUBLISHED[cfg.post],
      dateModified: UPDATED,
      inLanguage: BCP[lang],
      mainEntityOfPage: { "@id": `${url}#webpage` },
      isPartOf: { "@id": `${urlFor("blog", lang)}#blog` },
      author: { "@id": ORG },
      publisher: { "@id": ORG },
      image: { "@type": "ImageObject", url: OG.url, width: OG.width, height: OG.height },
      keywords: list(t(lang, `kw.${cfg.meta}`)),
      articleSection: t(lang, "nav.blog"),
      about: { "@id": PRODUCT },
    });
    nodes.push(product(lang));
  }

  return { "@context": "https://schema.org", "@graph": nodes };
}

export function renderHead(file, lang) {
  const cfg = PAGES[file];
  if (!cfg) return "";
  if (cfg.kind === "404") return `<!--seo-->\n  <meta name="robots" content="noindex, follow" />\n  <!--/seo-->`;

  const url = urlFor(cfg.slug, lang);
  const title = t(lang, `meta.${cfg.meta}Title`);
  const desc = t(lang, `meta.${cfg.meta}Desc`);
  const article = cfg.kind === "post";
  const tags = [
    meta("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"),
    meta("name", "keywords", t(lang, `kw.${cfg.meta}`)),
    meta("name", "author", "ERST IT Solutions"),
    `<link rel="canonical" href="${url}" />`,
    ...HREFLANG.map(([code, l]) => `<link rel="alternate" hreflang="${code}" href="${urlFor(cfg.slug, l)}" />`),
    `<link rel="sitemap" type="application/xml" href="/sitemap.xml" />`,
    meta("property", "og:type", article ? "article" : "website"),
    meta("property", "og:site_name", "ERST IT Solutions"),
    meta("property", "og:locale", LOCALES[lang]),
    ...LANGS.filter((l) => l !== lang).map((l) => meta("property", "og:locale:alternate", LOCALES[l])),
    meta("property", "og:title", title),
    meta("property", "og:description", desc),
    meta("property", "og:url", url),
    meta("property", "og:image", OG.url),
    meta("property", "og:image:type", "image/png"),
    meta("property", "og:image:width", OG.width),
    meta("property", "og:image:height", OG.height),
    meta("property", "og:image:alt", t(lang, "meta.ogAlt")),
    meta("name", "twitter:card", "summary_large_image"),
    meta("name", "twitter:title", title),
    meta("name", "twitter:description", desc),
    meta("name", "twitter:image", OG.url),
    meta("name", "twitter:image:alt", t(lang, "meta.ogAlt")),
  ];
  if (article) {
    tags.push(
      meta("property", "article:published_time", PUBLISHED[cfg.post]),
      meta("property", "article:modified_time", UPDATED),
      meta("property", "article:author", "ERST IT Solutions"),
      meta("property", "article:section", t(lang, "nav.blog")),
      ...list(t(lang, `kw.${cfg.meta}`)).map((k) => meta("property", "article:tag", k)),
    );
  }
  tags.push(
    meta("name", "geo.region", "TR-34"),
    meta("name", "geo.placename", "Esenyurt, İstanbul"),
    meta("name", "geo.position", `${GEO.lat};${GEO.lng}`),
    meta("name", "ICBM", `${GEO.lat}, ${GEO.lng}`),
    `<script type="application/ld+json">${JSON.stringify(graph(file, lang)).replace(/</g, "\\u003c")}</script>`,
  );
  if (lang === "fa") tags.push(`<link rel="preload" href="/fonts/estedad.woff2" as="font" type="font/woff2" crossorigin />`);
  return `<!--seo-->\n  ${tags.join("\n  ")}\n  <!--/seo-->`;
}

// Headings use Unbounded 500; Turkish also needs the latin-ext subset (ı, ş, ğ). Persian headings use Estedad.
const HEADING_SUBSETS = { tr: ["latin", "latin-ext"], en: ["latin"], fa: [] };

function headingFonts(assetsDir) {
  const files = fs.existsSync(assetsDir) ? fs.readdirSync(assetsDir) : [];
  const find = (subset) => files.find((f) => new RegExp(`^unbounded-${subset}-500-normal-[\\w-]+\\.woff2$`).test(f));
  return (head, lang) => {
    const links = HEADING_SUBSETS[lang]
      .map(find)
      .filter(Boolean)
      .map((f) => `<link rel="preload" href="/assets/${f}" as="font" type="font/woff2" crossorigin />`);
    return links.length ? head.replace("<!--/seo-->", `${links.join("\n  ")}\n  <!--/seo-->`) : head;
  };
}

function localizeLinks(document, lang) {
  if (lang === "tr") return;
  document.querySelectorAll('a[href^="/"]:not([data-lang])').forEach((a) => {
    const href = a.getAttribute("href");
    if (ASSET.test(href) || /^\/(en|fa)(\/|$)/.test(href)) return;
    const hashAt = href.indexOf("#");
    const hash = hashAt >= 0 ? href.slice(hashAt) : "";
    const bare = hashAt >= 0 ? href.slice(0, hashAt) : href;
    a.setAttribute("href", `${bare === "/" ? `/${lang}/` : `/${lang}${bare}`}${hash}`);
  });
}

function sitemap() {
  const rows = [];
  for (const cfg of Object.values(PAGES)) {
    if (cfg.slug === null) continue;
    const alts = HREFLANG.map(([code, l]) => `    <xhtml:link rel="alternate" hreflang="${code}" href="${urlFor(cfg.slug, l)}" />`).join("\n");
    for (const lang of LANGS) {
      rows.push(`  <url>\n    <loc>${urlFor(cfg.slug, lang)}</loc>\n    <lastmod>${UPDATED}</lastmod>\n${alts}\n  </url>`);
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join("\n")}\n</urlset>\n`;
}

function countryOf(req) {
  return req.headers["cf-ipcountry"] || req.headers["x-country"] || "";
}

function redirectTo(res, status, location) {
  res.statusCode = status;
  res.setHeader("Location", location);
  res.setHeader("Cache-Control", "private, no-store");
  res.end();
}

export function seo() {
  let outDir = "dist";
  let root = process.cwd();
  const routeLocale = (req, res, next) => {
    const raw = req.url || "/";
    const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
    let pathname = raw.split("?")[0];
    try {
      pathname = decodeURIComponent(pathname);
    } catch {
      /* keep the raw path */
    }
    if (/^\/(en|fa)$/.test(pathname)) {
      redirectTo(res, 301, `${pathname}/${q}`);
      return;
    }
    const dest = localeRedirect({
      pathname,
      cookie: req.headers.cookie || "",
      ua: req.headers["user-agent"] || "",
      country: countryOf(req),
    });
    if (dest) {
      redirectTo(res, 302, dest + q);
      return;
    }
    req.erstPath = pathname;
    next();
  };
  return {
    name: "erst-seo",
    configResolved(config) {
      root = config.root;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    transformIndexHtml(html, ctx) {
      if (!html.includes("<!--seo-->") || html.includes("<!--/seo-->")) return html;
      const file = path.basename(ctx.filename);
      if (!PAGES[file]) return html;
      return html.replace("<!--seo-->", renderHead(file, "tr"));
    },
    configureServer(server) {
      server.middlewares.use(routeLocale);
      server.middlewares.use(async (req, res, next) => {
        const pathname = req.erstPath || (req.url || "/").split("?")[0];
        const match = pathname.match(/^\/(en|fa)(\/.*)?$/);
        if (!match || pathname.includes(".")) return next();
        const lang = match[1];
        const rest = match[2] && match[2] !== "/" ? match[2].replace(/\/$/, "") : "/";
        const file = rest === "/" ? "index.html" : `${rest.slice(1)}.html`;
        if (!PAGES[file] || PAGES[file].slug === null) return next();
        try {
          const source = fs.readFileSync(path.join(root, file), "utf8").replace("<!--seo-->", renderHead(file, lang));
          const transformed = await server.transformIndexHtml(pathname, source);
          const { document } = parseHTML(transformed);
          translate(document, lang);
          localizeLinks(document, lang);
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Content-Language", lang);
          res.end(document.toString());
        } catch (error) {
          next(error);
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(routeLocale);
    },
    closeBundle() {
      if (!fs.existsSync(path.join(outDir, "index.html"))) return;
      const preload = headingFonts(path.join(outDir, "assets"));
      for (const [file, cfg] of Object.entries(PAGES)) {
        if (cfg.slug === null) continue;
        let source = fs.readFileSync(path.join(outDir, file), "utf8");
        for (const lang of ["en", "fa"]) {
          const { document } = parseHTML(source);
          translate(document, lang);
          localizeLinks(document, lang);
          const html = document.toString().replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, preload(renderHead(file, lang), lang));
          fs.mkdirSync(path.join(outDir, lang), { recursive: true });
          fs.writeFileSync(path.join(outDir, lang, file), html);
        }
        if (source.includes("data-prose")) {
          const { document } = parseHTML(source);
          document.querySelectorAll('[data-prose]:not([data-prose="tr"])').forEach((el) => el.remove());
          source = document.toString();
        }
        fs.writeFileSync(path.join(outDir, file), source.replace(/<!--seo-->[\s\S]*?<!--\/seo-->/, (head) => preload(head, "tr")));
      }
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap());
    },
  };
}
