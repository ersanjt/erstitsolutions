import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { LANGS, PAGES, settle, slug, url } from "./pages.js";

for (const lang of LANGS) {
  for (const page of PAGES) {
    test(`accessible: ${slug(lang, page)}`, async ({ page: tab }) => {
      await tab.goto(url(lang, page));
      await settle(tab);
      const { violations } = await new AxeBuilder({ page: tab })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        // Decorative aria-hidden logotype; WCAG 1.4.3 exempts logo text from contrast.
        .exclude(".footer-word")
        .analyze();
      const report = violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.target.join(" ")).slice(0, 5).join("\n  ")}`,
      );
      expect(report, report.join("\n")).toEqual([]);
    });
  }
}
