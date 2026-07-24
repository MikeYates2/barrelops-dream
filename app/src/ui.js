// Tiny DOM helper so we can build views without JSX/build tooling.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === "html") {
      node.innerHTML = value;
    } else if (key in node && key !== "list") {
      try {
        node[key] = value;
      } catch {
        node.setAttribute(key, value);
      }
    } else {
      node.setAttribute(key, value);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  kids.flat(Infinity).forEach((child) => {
    if (child == null || child === false) return;
    node.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function mount(container, node) {
  container.replaceChildren(node);
}

export function fmtMoney(n) {
  if (n == null || isNaN(n)) return "—";
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function fmtDate(d) {
  if (!d) return "—";
  let date;
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    // Date-only string (e.g. from the calendar) — parse as local, not UTC,
    // so the displayed day always matches what was selected.
    const [y, m, day] = d.split("-").map(Number);
    date = new Date(y, m - 1, day);
  } else {
    date = typeof d === "string" ? new Date(d) : d;
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---- Luxury visual language: glass surfaces, gold accents, serif display type ----

// Status is conveyed by fill weight and contrast, not hue, to stay within
// the black/white/cream palette: red is deliberately the dimmest (muted,
// inactive), green/gold are solid bright fills (positive, high-emphasis).
export function badge(text, tone = "neutral") {
  const tones = {
    neutral: "bg-white/[0.06] text-ivory/70 border border-white/10",
    green: "bg-ivory text-noir font-semibold border border-ivory",
    red: "bg-transparent text-ivory/35 border border-white/15",
    amber: "bg-white/10 text-ivory border border-white/20",
    blue: "bg-transparent text-ivory/75 border border-white/25",
    gold: "bg-gold-light text-noir font-semibold border border-transparent",
  };
  return el("span", {
    class: `inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide ${tones[tone] || tones.neutral}`,
    textContent: text,
  });
}

// Attaches a pointer-tracked light sheen to a glass surface (the "liquid" in liquid glass).
function attachGlare(node) {
  node.addEventListener("pointermove", (e) => {
    const rect = node.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    node.style.setProperty("--mx", `${x}%`);
    node.style.setProperty("--my", `${y}%`);
  });
  return node;
}

// A glass card. `strong` uses the gold-bordered variant reserved for emphasis
// (hero panels, membership CTA). `glare` toggles the pointer-tracked sheen.
// `reveal` opts into the scroll fade-in — only safe for nodes built once and
// never replaced afterward. Views that redraw a card in response to state
// (search results, forms, status panels) must leave this off: the node would
// be recreated at opacity 0 with no guarantee anything re-observes it, so it
// can end up permanently invisible.
export function card(children, extraClass = "", opts = {}) {
  const { strong = false, glare = true, reveal = false } = opts;
  const node = el(
    "div",
    {
      class: `${reveal ? "reveal" : ""} relative overflow-hidden rounded-2xl ${strong ? "glass-strong" : "glass"} ${glare ? "glass-glare" : ""} ${extraClass}`,
    },
    children
  );
  if (glare) attachGlare(node);
  return node;
}

export function button(label, opts = {}) {
  const { variant = "gold", onClick, type = "button", disabled = false, extraClass = "" } = opts;
  const variants = {
    gold: "bg-gradient-to-b from-gold-light to-gold-dark text-noir font-semibold shadow-[0_4px_20px_rgba(255,255,255,0.25)] hover:shadow-[0_6px_28px_rgba(255,255,255,0.4)] hover:brightness-105",
    secondary: "bg-white/[0.04] text-ivory border border-white/15 hover:border-white/40 hover:bg-white/[0.07]",
    ghost: "text-ivory/60 hover:text-ivory hover:bg-white/[0.05]",
    danger: "bg-transparent text-ivory border-2 border-white/50 hover:bg-white/10 hover:border-white",
  };
  return el("button", {
    type,
    class: `inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${extraClass}`,
    onclick: onClick,
    disabled,
    textContent: label,
  });
}

export function field(labelText, inputNode, hint) {
  return el("label", { class: "block" }, [
    el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, labelText),
    inputNode,
    hint ? el("span", { class: "block text-xs text-ivory/40 mt-1.5" }, hint) : null,
  ]);
}

export function textInput(attrs = {}) {
  return el("input", {
    class:
      "w-full rounded-lg bg-white/[0.04] border border-white/15 px-3.5 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors",
    ...attrs,
  });
}

export function selectInput(options, attrs = {}) {
  const select = el(
    "select",
    {
      class:
        "w-full rounded-lg bg-white/[0.04] border border-white/15 px-3.5 py-2.5 text-sm text-ivory focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50 transition-colors [color-scheme:dark]",
      ...attrs,
    },
    options.map((opt) => el("option", { value: opt.value, selected: opt.value === attrs.value }, opt.label))
  );
  return select;
}

// A marketing-style section heading: small gold eyebrow + large serif title + muted subtitle.
export function sectionHeading({ eyebrow, title, subtitle, align = "center" }) {
  const alignClass = align === "left" ? "text-left items-start" : "text-center items-center";
  return el("div", { class: `reveal flex flex-col ${alignClass} gap-4 mb-14` }, [
    eyebrow ? el("span", { class: "text-xs font-semibold tracking-[0.25em] text-gold uppercase" }, eyebrow) : null,
    el("h2", { class: `font-serif text-4xl md:text-5xl text-ivory leading-tight max-w-2xl` }, title),
    subtitle ? el("p", { class: "text-ivory/50 text-base max-w-xl leading-relaxed" }, subtitle) : null,
  ]);
}

// Observes every .reveal element under `root` and fades it in once visible.
// Call after mounting new content into the live document.
export function initScrollReveal(root = document) {
  const targets = root.querySelectorAll(".reveal:not(.reveal-in)");
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
  );
  targets.forEach((t) => io.observe(t));
}
