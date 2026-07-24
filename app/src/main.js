import { getState, subscribe, setRole, setCustomerEmail } from "./store.js";
import { el, mount, button, initScrollReveal } from "./ui.js";
import { route, notFoundRoute, startRouter, navigate, currentRoutePath } from "./router.js";

import { renderMarketplace } from "./views/marketplace.js";
import { renderBarrelForm } from "./views/barrelForm.js";
import { renderInventoryUpload } from "./views/inventoryUpload.js";
import { renderPickWizard } from "./views/pickWizard.js";
import { renderPickDetail } from "./views/pickDetail.js";
import { renderMyPicks } from "./views/myPicks.js";
import { renderStaffDashboard } from "./views/staffDashboard.js";

const appRoot = document.getElementById("app");

function navLink(label, path, icon) {
  const active = currentRoutePath() === path;
  return el(
    "a",
    {
      href: `#${path}`,
      class: `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm tracking-wide transition-all duration-300 ${
        active
          ? "bg-gradient-to-r from-white/15 to-transparent text-gold-light border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          : "text-ivory/50 hover:text-ivory hover:bg-white/[0.04] border border-transparent"
      }`,
    },
    [el("span", { class: "text-base leading-none opacity-80" }, icon), label]
  );
}

function roleSwitcher() {
  const state = getState();
  return el("div", { class: "px-4 py-5 border-t border-white/10" }, [
    el("div", { class: "text-[10px] font-semibold text-ivory/30 uppercase tracking-[0.2em] mb-3" }, "Viewing as"),
    el("div", { class: "flex gap-2" }, [
      button("Customer", {
        variant: state.currentRole === "customer" ? "gold" : "secondary",
        extraClass: "flex-1 !py-1.5 !px-2 text-xs",
        onClick: () => {
          setRole("customer");
          navigate("/");
        },
      }),
      button("Dream Staff", {
        variant: state.currentRole === "staff" ? "gold" : "secondary",
        extraClass: "flex-1 !py-1.5 !px-2 text-xs",
        onClick: () => {
          setRole("staff");
          navigate("/dashboard");
        },
      }),
    ]),
    state.currentRole === "customer"
      ? el("div", { class: "mt-4" }, [
          el("label", { class: "block text-[10px] text-ivory/30 uppercase tracking-widest mb-1.5" }, "Your email (demo login)"),
          el("input", {
            type: "email",
            placeholder: "you@example.com",
            value: state.currentCustomerEmail || "",
            class:
              "w-full rounded-lg bg-white/[0.04] border border-white/15 px-2.5 py-1.5 text-xs text-ivory placeholder:text-ivory/25 focus:outline-none focus:ring-1 focus:ring-gold/50",
            onchange: (e) => setCustomerEmail(e.target.value.trim()),
          }),
        ])
      : null,
  ]);
}

function shell(contentNode) {
  const state = getState();
  const staffLinks =
    state.currentRole === "staff"
      ? [
          navLink("Dashboard", "/dashboard", "◈"),
          navLink("Add Barrel", "/inventory/new", "✎"),
          navLink("Upload Inventory", "/inventory/upload", "⇧"),
        ]
      : [];
  const customerLinks = state.currentRole === "customer" ? [navLink("My Picks", "/my-picks", "◈")] : [];

  const sidebar = el(
    "aside",
    { class: "w-64 shrink-0 glass border-r border-white/10 flex flex-col h-screen sticky top-0 z-20" },
    [
      el("div", { class: "px-5 py-6 border-b border-white/10 flex items-center gap-3" }, [
        el("img", {
          src: "/src/assets/dream-spirits-logo.png",
          alt: "Dream Spirits",
          class: "w-12 h-12 rounded-lg object-contain shrink-0",
        }),
        el("div", {}, [
          el("div", { class: "font-serif text-xl text-ivory leading-tight tracking-wide" }, "Dream Spirits"),
          el("div", { class: "text-[10px] text-gold/70 tracking-[0.2em] uppercase" }, "Barrel Pick Ops"),
        ]),
      ]),
      el("nav", { class: "flex-1 px-3 py-5 space-y-1 overflow-y-auto" }, [
        navLink("Marketplace", "/", "◆"),
        ...staffLinks,
        ...customerLinks,
      ]),
      roleSwitcher(),
    ]
  );

  return el("div", { class: "flex min-h-screen" }, [sidebar, el("main", { class: "flex-1 min-w-0" }, contentNode)]);
}

let lastScrolledPath = null;

function draw(contentNode) {
  mount(appRoot, shell(contentNode));
  // Only jump to top on an actual route change. Store mutations (approving a
  // date, saving bottling status, submitting the membership form, etc.) also
  // flow through this same draw() via the global subscribe-and-rerender
  // below, and on a long page that would yank the viewport away from
  // whatever the user just clicked.
  const path = currentRoutePath();
  if (path !== lastScrolledPath) {
    window.scrollTo({ top: 0 });
    lastScrolledPath = path;
  }
  requestAnimationFrame(() => initScrollReveal(appRoot));
}

route("/", () => draw(renderMarketplace()));
route("/inventory/new", () => draw(renderBarrelForm()));
route("/inventory/upload", () => draw(renderInventoryUpload()));
route("/pick/new/:barrelId", (params) => draw(renderPickWizard(params)));
route("/pick/:id", (params) => draw(renderPickDetail(params)));
route("/my-picks", () => draw(renderMyPicks()));
route("/dashboard", () => draw(renderStaffDashboard()));
notFoundRoute(() =>
  draw(
    el("div", { class: "p-10 text-ivory/50" }, "Page not found. ", el("a", { href: "#/", class: "text-gold underline" }, "Go home"))
  )
);

subscribe(() => {
  // Full re-render on any state change keeps this simple at our scale.
  window.dispatchEvent(new HashChangeEvent("hashchange"));
});

startRouter();
