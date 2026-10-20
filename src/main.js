import { LANGS, STORAGE_KEY, site } from "./config.js";
import { t } from "./i18n.js";

const page = document.body.dataset.page || "home";
const lang = LANGS.includes(document.documentElement.lang) ? document.documentElement.lang : "tr";

function remember(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
    document.cookie = `${STORAGE_KEY}=${value}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* private mode */
  }
}

function markNav() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function bindLanguage() {
  const root = document.querySelector(".langs");
  if (!root) return;
  const panel = root.querySelector(".langs__panel");
  const current = root.querySelector("[data-lang-current]");
  const active = root.querySelector(`[data-lang="${lang}"]`);
  if (current && active) {
    current.textContent = active.textContent.trim();
    current.lang = lang;
  }
  const sync = () => {
    if (!panel) return;
    if (root.open) panel.removeAttribute("inert");
    else panel.setAttribute("inert", "");
  };
  sync();
  root.addEventListener("toggle", sync);
  document.addEventListener("click", (event) => {
    if (!root.open || root.contains(event.target)) return;
    root.open = false;
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && root.open) root.open = false;
  });
  root.querySelectorAll("[data-lang]").forEach((link) => {
    link.addEventListener("click", () => remember(link.dataset.lang));
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
    document.documentElement.classList.toggle("menu-open", open);
  };
  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
  const desktop = window.matchMedia("(min-width: 981px)");
  const onDesktop = () => { if (desktop.matches) setOpen(false); };
  if (desktop.addEventListener) desktop.addEventListener("change", onDesktop);
  else desktop.addListener(onDesktop);
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
    const subject = encodeURIComponent(site.legalName);
    const body = encodeURIComponent(text);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
  });
}

document.querySelectorAll("[data-year]").forEach((el) => {
  el.textContent = String(new Date().getFullYear());
});

document.body.dataset.lang = lang;
if (document.referrer.startsWith(`${location.origin}/`)) remember(lang);
markNav();
bindLanguage();
bindMenu();
bindFilters();
bindForm();
import("./motion.js");
