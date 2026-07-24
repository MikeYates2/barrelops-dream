import { getState, subscribe, setRole, setCustomerEmail } from "./store.js";
import { el, mount, button } from "./ui.js";
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
      class: `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-amber-800 text-white" : "text-stone-600 hover:bg-stone-100"
      }`,
    },
    [el("span", { class: "text-base leading-none", html: icon }), label]
  );
}

function roleSwitcher() {
  const state = getState();
  return el("div", { class: "px-3 py-3 border-t border-stone-200" }, [
    el("div", { class: "text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2" }, "Viewing as"),
    el("div", { class: "flex gap-2" }, [
      button("Customer", {
        variant: state.currentRole === "customer" ? "gold" : "secondary",
        extraClass: "flex-1 !py-1.5 text-xs",
        onClick: () => {
          setRole("customer");
          navigate("/");
        },
      }),
      button("Dream Staff", {
        variant: state.currentRole === "staff" ? "gold" : "secondary",
        extraClass: "flex-1 !py-1.5 text-xs",
        onClick: () => {
          setRole("staff");
          navigate("/dashboard");
        },
      }),
    ]),
    state.currentRole === "customer"
      ? el("div", { class: "mt-3" }, [
          el("label", { class: "block text-xs text-stone-500 mb-1" }, "Your email (demo login)"),
          el("input", {
            type: "email",
            placeholder: "you@example.com",
            value: state.currentCustomerEmail || "",
            class:
              "w-full rounded-md border border-stone-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600/40",
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
          navLink("Dashboard", "/dashboard", "&#128203;"),
          navLink("Add Barrel", "/inventory/new", "&#127991;"),
          navLink("Upload Inventory", "/inventory/upload", "&#11014;"),
        ]
      : [];
  const customerLinks = state.currentRole === "customer" ? [navLink("My Picks", "/my-picks", "&#128203;")] : [];

  const sidebar = el("aside", { class: "w-64 shrink-0 bg-white border-r border-stone-200 flex flex-col h-screen sticky top-0" }, [
    el("div", { class: "px-4 py-5 border-b border-stone-200 flex items-center gap-2" }, [
      el("div", { class: "w-9 h-9 rounded-full bg-amber-800 text-white flex items-center justify-center font-bold text-sm" }, "DS"),
      el("div", {}, [
        el("div", { class: "font-bold text-stone-900 leading-tight" }, "Dream Spirits"),
        el("div", { class: "text-[11px] text-stone-400 tracking-wide" }, "Barrel Pick Ops"),
      ]),
    ]),
    el("nav", { class: "flex-1 px-3 py-4 space-y-1 overflow-y-auto" }, [
      navLink("Marketplace", "/", "&#128230;"),
      ...staffLinks,
      ...customerLinks,
    ]),
    roleSwitcher(),
  ]);

  return el("div", { class: "flex min-h-screen bg-stone-50" }, [sidebar, el("main", { class: "flex-1 min-w-0" }, contentNode)]);
}

function draw(contentNode) {
  mount(appRoot, shell(contentNode));
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
    el("div", { class: "p-10 text-stone-500" }, "Page not found. ", el("a", { href: "#/", class: "text-amber-700 underline" }, "Go home"))
  )
);

subscribe(() => {
  // Full re-render on any state change keeps this simple at our scale.
  const path = currentRoutePath();
  window.dispatchEvent(new HashChangeEvent("hashchange"));
});

startRouter();
