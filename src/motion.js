import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
const isHome = document.body.dataset.page === "home";

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function splitWords(el) {
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.innerHTML = text
    .split(/\s+/)
    .map((w) => `<span class="w" aria-hidden="true"><span>${escapeHtml(w)}</span></span>`)
    .join(" ");
  return [...el.querySelectorAll(".w > span")];
}

function splitManifesto(el) {
  let out = false;
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((w) => {
      const span = `<span class="mw${out ? " mw--out" : ""}">${escapeHtml(w)}</span>`;
      if (w.endsWith(":")) out = true;
      return span;
    })
    .join(" ");
  return [...el.querySelectorAll(".mw")];
}

function revealManifesto(el) {
  const words = splitManifesto(el);
  gsap.fromTo(
    words,
    { opacity: 0.12, filter: "blur(8px)", yPercent: 18 },
    {
      opacity: 1,
      filter: "blur(0px)",
      yPercent: 0,
      stagger: 0.12,
      ease: "power1.out",
      scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 60%", scrub: 0.4 },
    },
  );
}

function header() {
  const bar = document.querySelector(".site-header");
  if (!bar) return;
  let last = 0;
  const update = () => {
    const y = window.scrollY;
    bar.classList.toggle("is-scrolled", y > 40);
    const menuOpen = document.querySelector(".mobile-nav.is-open");
    bar.classList.toggle("is-hidden", !menuOpen && y > 400 && y > last);
    last = y;
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function smooth() {
  const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

function cursor() {
  if (!fine) return;
  const dot = document.createElement("div");
  dot.className = "cursor";
  document.body.appendChild(dot);
  const x = gsap.quickTo(dot, "x", { duration: 0.35, ease: "power3" });
  const y = gsap.quickTo(dot, "y", { duration: 0.35, ease: "power3" });
  window.addEventListener("pointermove", (e) => {
    dot.classList.add("is-live");
    x(e.clientX);
    y(e.clientY);
  });
  document.documentElement.addEventListener("pointerleave", () => dot.classList.remove("is-live"));
  document.addEventListener("pointerover", (e) => {
    dot.classList.toggle("is-hover", Boolean(e.target.closest("a, button, [data-magnetic]")));
  });
}

function magnetic() {
  if (!fine) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * 0.3);
      my((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener("pointerleave", () => {
      mx(0);
      my(0);
    });
  });
}

function glow() {
  document.querySelectorAll("[data-glow]").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

const CONSOLE = [
  ["brief", "whatsapp desk · 3 branches · roles + 2fa"],
  ["plan", "6 tasks · api, inbox, roles, audit"],
  ["build", "inbox.service.ts"],
  ["test", "e2e scenarios passed"],
  ["review", "engineer approval"],
  ["ship", "production · v1.0", "ok"],
];

function consoleLog(still) {
  const list = document.querySelector("[data-console-log]");
  const state = document.querySelector("[data-console-state]");
  if (!list) return;
  if (still) {
    CONSOLE.forEach(([tag, text, cls]) => {
      const li = document.createElement("li");
      if (cls) li.className = cls;
      li.innerHTML = `<b>${tag}</b><span></span>`;
      li.querySelector("span").textContent = text;
      list.appendChild(li);
    });
    if (state) state.textContent = "done";
    return;
  }
  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(list);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const run = async () => {
    for (;;) {
      list.innerHTML = "";
      if (state) state.textContent = "running";
      for (const [tag, text, cls] of CONSOLE) {
        while (!visible) await wait(400);
        const li = document.createElement("li");
        if (cls) li.className = cls;
        li.innerHTML = `<b>${tag}</b><span></span><i class="caret">&nbsp;</i>`;
        list.appendChild(li);
        const span = li.querySelector("span");
        for (let i = 1; i <= text.length; i++) {
          span.textContent = text.slice(0, i);
          await wait(18 + Math.random() * 30);
        }
        li.querySelector(".caret").remove();
        await wait(380);
      }
      if (state) state.textContent = "done";
      await wait(3200);
    }
  };
  run();
}

function boot(onDone) {
  const el = document.querySelector("[data-boot]");
  if (!el) return onDone();
  let seen = false;
  try {
    seen = sessionStorage.getItem("erst-boot") === "1";
    sessionStorage.setItem("erst-boot", "1");
  } catch {
    /* ignore */
  }
  if (seen || reduce) {
    el.remove();
    return onDone();
  }
  const count = el.querySelector("[data-boot-count]");
  const state = { n: 0 };
  gsap.to(state, {
    n: 100,
    duration: 0.6,
    ease: "power2.inOut",
    onUpdate: () => {
      if (count) count.textContent = String(Math.round(state.n)).padStart(3, "0");
    },
    onComplete: () => {
      el.classList.add("is-done");
      setTimeout(() => el.remove(), 1000);
      onDone();
    },
  });
}

function heroIntro() {
  const title = document.querySelector(".hero__title");
  if (!title) return;
  const words = splitWords(title);
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(words, { yPercent: 115, duration: 1.3, stagger: 0.08 })
    .from(".hero .kicker", { opacity: 0, y: 12, duration: 0.8 }, 0.1)
    .from(".hero [data-fade]", { opacity: 0, y: 24, duration: 1, stagger: 0.1 }, 0.45)
    .from(".console", { opacity: 0, y: 30, scale: 0.97, duration: 1.2 }, 0.6)
    .from(".hero__foot", { opacity: 0, duration: 1 }, 0.9);
}

function headings() {
  document.querySelectorAll("[data-split]").forEach((el) => {
    if (el.classList.contains("hero__title")) return;
    const words = splitWords(el);
    gsap.from(words, {
      yPercent: 115,
      duration: 1.1,
      stagger: 0.06,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  });
  document.querySelectorAll("[data-fade]:not(.hero [data-fade])").forEach((el) => {
    gsap.from(el, { opacity: 0, y: 24, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } });
  });
}

function reveals() {
  const items = gsap.utils.toArray("[data-reveal]");
  if (!items.length) return;
  gsap.set(items, { opacity: 0, y: 50 });
  ScrollTrigger.batch(items, {
    start: "top 88%",
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, stagger: 0.1, ease: "expo.out", overwrite: true }),
  });
}

function manifesto() {
  const el = document.querySelector("[data-words]");
  if (el) revealManifesto(el);
  const flow = document.querySelector("[data-flow]");
  if (!flow) return;
  const draw = (paths) =>
    paths.forEach((p) => {
      const length = p.getTotalLength();
      gsap.set(p, { strokeDasharray: length, strokeDashoffset: length });
    });
  const lines = gsap.utils.toArray(".flow__line:not(.flow__line--out)", flow);
  const out = flow.querySelector(".flow__line--out");
  draw([...lines, out]);
  gsap
    .timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: flow,
        start: "top 90%",
        end: "center 60%",
        scrub: 0.5,
        onUpdate: (self) => flow.classList.toggle("is-live", self.progress > 0.97),
      },
    })
    .from(flow.querySelectorAll(".flow__agents rect, .flow__blink, .flow__label"), { opacity: 0, stagger: 0.04, duration: 0.4 })
    .to(lines, { strokeDashoffset: 0, stagger: 0.08, duration: 1 }, 0.2)
    .from(flow.querySelector(".flow__gate"), { scale: 0.3, opacity: 0, transformOrigin: "50% 50%", duration: 0.4, ease: "back.out(2)" })
    .to(out, { strokeDashoffset: 0, duration: 0.6 })
    .from(flow.querySelector(".flow__ship"), { opacity: 0, y: 12, duration: 0.4 });
}

function nextSteps(still) {
  const box = document.querySelector("[data-steps]");
  if (!box) return;
  const items = [...box.querySelectorAll("li")];
  if (still) {
    items.forEach((li) => {
      li.classList.add("is-on");
      li.style.setProperty("--p", 1);
    });
    return;
  }
  box.classList.add("is-armed");
  const at = (i) => 0.02 + (0.96 * i) / (items.length - 1);
  const update = ({ progress }) =>
    items.forEach((li, i) => {
      li.classList.toggle("is-on", progress >= at(i));
      if (i < items.length - 1) li.style.setProperty("--p", gsap.utils.clamp(0, 1, (progress - at(i)) / (at(i + 1) - at(i))));
    });
  ScrollTrigger.create({ trigger: box, start: "top 80%", end: "bottom 60%", onUpdate: update, onRefresh: update });
}

function pipeline() {
  const section = document.querySelector("[data-pipeline]");
  const track = document.querySelector("[data-track]");
  const bar = document.querySelector("[data-progress]");
  if (!section || !track) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 981px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    const dir = () => (document.documentElement.dir === "rtl" ? 1 : -1);
    const tween = gsap.to(track, {
      x: () => dir() * distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (self) => bar && gsap.set(bar, { scaleX: self.progress }),
      },
    });
    return () => tween.kill();
  });
}

function device() {
  const el = document.querySelector("[data-device]");
  if (!el) return;
  el.classList.add("is-armed");
  ScrollTrigger.create({ trigger: el, start: "top 75%", once: true, onEnter: () => el.classList.add("is-in") });
}

async function core(still) {
  const canvas = document.querySelector("[data-core]");
  if (!canvas) return;
  try {
    const { initCore } = await import("./core.js");
    const scene = initCore(canvas, { still });
    if (!scene || still) return;
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => scene.setScroll(self.progress),
    });
  } catch {
    canvas.remove();
  }
}

header();

if (reduce) {
  document.querySelector("[data-boot]")?.remove();
  document.querySelector("[data-device]")?.classList.add("is-in");
  const m = document.querySelector("[data-words]");
  if (m) splitManifesto(m);
  nextSteps(true);
  consoleLog(true);
  if (isHome) core(true);
} else {
  smooth();
  cursor();
  magnetic();
  glow();
  boot(() => {
    heroIntro();
    consoleLog();
  });
  headings();
  reveals();
  manifesto();
  pipeline();
  nextSteps();
  device();
  if (isHome) core();
}

document.addEventListener("erst:lang", () => {
  if (reduce) return;
  document.querySelectorAll("[data-split]").forEach((el) => {
    splitWords(el).forEach((w) => gsap.set(w, { yPercent: 0 }));
  });
  const m = document.querySelector("[data-words]");
  if (m) {
    ScrollTrigger.getAll().forEach((st) => st.vars.trigger === m && st.kill());
    revealManifesto(m);
  }
  ScrollTrigger.refresh();
});
