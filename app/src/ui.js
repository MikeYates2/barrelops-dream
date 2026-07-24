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

export function badge(text, tone = "neutral") {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return el("span", {
    class: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${tones[tone] || tones.neutral}`,
    textContent: text,
  });
}

export function card(children, extraClass = "") {
  return el("div", { class: `bg-white border border-stone-200 rounded-xl shadow-sm ${extraClass}` }, children);
}

export function button(label, opts = {}) {
  const { variant = "primary", onClick, type = "button", disabled = false, extraClass = "" } = opts;
  const variants = {
    primary: "bg-stone-900 text-white hover:bg-stone-800",
    secondary: "bg-white text-stone-800 border border-stone-300 hover:bg-stone-50",
    gold: "bg-amber-700 text-white hover:bg-amber-800",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-stone-600 hover:bg-stone-100",
  };
  return el("button", {
    type,
    class: `inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${extraClass}`,
    onclick: onClick,
    disabled,
    textContent: label,
  });
}

export function field(labelText, inputNode, hint) {
  return el("label", { class: "block" }, [
    el("span", { class: "block text-sm font-medium text-stone-700 mb-1" }, labelText),
    inputNode,
    hint ? el("span", { class: "block text-xs text-stone-400 mt-1" }, hint) : null,
  ]);
}

export function textInput(attrs = {}) {
  return el("input", {
    class: "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600",
    ...attrs,
  });
}

export function selectInput(options, attrs = {}) {
  const select = el(
    "select",
    {
      class: "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 bg-white",
      ...attrs,
    },
    options.map((opt) =>
      el("option", { value: opt.value, selected: opt.value === attrs.value }, opt.label)
    )
  );
  return select;
}
