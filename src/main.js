import { LANGS, STORAGE_KEY, site } from "./config.js";
import { t } from "./i18n.js";

const page = document.body.dataset.page || "home";

function readLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* private mode */
  }
  return "tr";
}

function remember(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

function apply(lang) {
  document.documentElement.lang = lang === "fa" ? "fa" : lang === "en" ? "en" : "tr";
  document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(lang, el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(lang, el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-content]").forEach((el) => {
    el.setAttribute("content", t(lang, el.dataset.i18nContent));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", t(lang, el.dataset.i18nAria));
  });

  const titleKey = document.body.dataset.titleKey;
  if (titleKey) document.title = t(lang, titleKey);

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.setAttribute("aria-pressed", btn.dataset.lang === lang ? "true" : "false");
  });

  document.documentElement.classList.remove("i18n-pending");
  document.documentElement.classList.add("i18n-ready");
  document.body.dataset.lang = lang;
}

function markNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function bindLanguage() {
  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      remember(lang);
      apply(lang);
    });
  });
}

function bindMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const panel = document.querySelector(".mobile-nav");
  if (!toggle || !panel) return;
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("is-open", open);
    panel.hidden = !open;
  };
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function bindFilters() {
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-tags]")];
  if (!buttons.length || !cards.length) return;
  const run = (filter) => {
    buttons.forEach((btn) => btn.setAttribute("aria-pressed", btn.dataset.filter === filter ? "true" : "false"));
    cards.forEach((card) => {
      const tags = card.dataset.tags.split(/\s+/);
      card.hidden = filter !== "all" && !tags.includes(filter);
    });
  };
  buttons.forEach((btn) => btn.addEventListener("click", () => run(btn.dataset.filter)));
}

function bindForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const error = form.querySelector(".form-error");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const lang = document.body.dataset.lang || "tr";
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const interest = String(data.get("interest") || "").trim();
    const message = String(data.get("message") || "").trim();
    if (!name || !message) {
      error.textContent = t(lang, "contact.err");
      return;
    }
    error.textContent = "";
    const interestLabel = t(lang, interest);
    const text = [
      site.legalName,
      `${name}${phone ? " · " + phone : ""}`,
      interestLabel,
      message,
    ].join("\n");
    window.open(`${site.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

apply(readLang());
markNav();
bindLanguage();
bindMenu();
bindFilters();
bindForm();
