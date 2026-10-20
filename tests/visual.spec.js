import { expect, test } from "@playwright/test";
import { LANGS, PAGES, settle, slug, url } from "./pages.js";

const cases = [
  ...PAGES.map((page) => ["", page]),
  ...["", "services", "contact"].flatMap((page) => ["en/", "fa/"].map((lang) => [lang, page])),
];

for (const [lang, page] of cases) {
  test(`looks the same: ${slug(lang, page)}`, async ({ page: tab }) => {
    await tab.goto(url(lang, page));
    await settle(tab);
    await expect(tab).toHaveScreenshot(`${slug(lang, page)}.png`, {
      fullPage: true,
      mask: [tab.locator("canvas")],
    });
  });
}

test("looks the same: 404", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res.status()).toBe(404);
  await settle(page);
  await expect(page).toHaveScreenshot("tr-404.png", { fullPage: true });
});

test("every language root loads", async ({ page }) => {
  for (const lang of LANGS) {
    const res = await page.goto(url(lang, ""));
    expect(res.status()).toBe(200);
  }
});
