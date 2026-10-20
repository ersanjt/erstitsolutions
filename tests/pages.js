export const PAGES = [
  "",
  "services",
  "about",
  "work",
  "products",
  "contact",
  "blog",
  "blog-whatsapp",
  "blog-qr",
  "blog-exchange",
];

export const LANGS = ["", "en/", "fa/"];

export const url = (lang, page) => `/${lang}${page}`;

export const slug = (lang, page) => `${lang.replace("/", "") || "tr"}-${page || "home"}`;

export async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  });
  await page.waitForTimeout(300);
}
