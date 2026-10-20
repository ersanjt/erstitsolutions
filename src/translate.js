import { t } from "./i18n.js";

export const LOCALES = { tr: "tr_TR", en: "en_US", fa: "fa_IR" };

export function translate(doc, lang) {
  const root = doc.documentElement;
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");

  doc.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(lang, el.getAttribute("data-i18n"));
  });
  doc.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(lang, el.getAttribute("data-i18n-placeholder")));
  });
  doc.querySelectorAll("[data-i18n-content]").forEach((el) => {
    el.setAttribute("content", t(lang, el.getAttribute("data-i18n-content")));
  });
  doc.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(lang, el.getAttribute("data-i18n-aria")));
  });
  doc.querySelectorAll("[data-i18n-alt]").forEach((el) => {
    el.setAttribute("alt", t(lang, el.getAttribute("data-i18n-alt")));
  });

  const titleKey = doc.body.getAttribute("data-title-key");
  const title = doc.querySelector("title");
  if (titleKey && title) title.textContent = t(lang, titleKey);

  doc.querySelectorAll("[data-prose]").forEach((el) => {
    if (el.getAttribute("data-prose") === lang) el.removeAttribute("hidden");
    else el.remove();
  });

  doc.querySelectorAll("[data-lang]").forEach((el) => {
    if (el.getAttribute("data-lang") === lang) el.setAttribute("aria-current", "true");
    else el.removeAttribute("aria-current");
  });
  const currentLink = doc.querySelector(`[data-lang="${lang}"]`);
  const currentLabel = doc.querySelector("[data-lang-current]");
  if (currentLink && currentLabel) {
    currentLabel.textContent = currentLink.textContent.trim();
    currentLabel.setAttribute("lang", lang);
  }
}
