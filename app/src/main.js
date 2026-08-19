import { getState, subscribe, logout } from "./store.js";
import { el, mount, button, initScrollReveal } from "./ui.js";
import { route, notFoundRoute, startRouter, navigate, currentRoutePath } from "./router.js";

import { renderLogin } from "./views/login.js";
import { renderMarketplace } from "./views/marketplace.js";
import { renderBarrelForm } from "./views/barrelForm.js";
import { renderInventoryUpload } from "./views/inventoryUpload.js";
import { renderPickWizard } from "./views/pickWizard.js";
import { renderPickDetail } from "./views/pickDetail.js";
import { renderMyPicks } from "./views/myPicks.js";
import { renderMyAccount } from "./views/myAccount.js";
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
          ? "bg-gradient-to-r from-gold/20 to-transparent text-gold-light border border-gold/25 shadow-[0_0_20px_rgba(201,168,106,0.12)]"
          : "text-ivory/50 hover:text-ivory hover:bg-white/[0.04] border border-transparent"
      }`,
    },
    [el("span", { class: "text-base leading-none opacity-80" }, icon), label]
  );
}

// Shows who's signed in and lets them sign out. Replaces the old open
// role-switcher — role is now set by logging in, not toggled at will.
function sessionFooter() {
  const state = getState();
  const isStaff = state.currentRole === "staff";
  const name = isStaff ? state.staffName : state.customerName;
  return el("div", { class: "px-4 py-5 border-t border-white/10" }, [
    el("div", { class: "text-[10px] font-semibold text-ivory/30 uppercase tracking-[0.2em] mb-1.5" }, isStaff ? "Dream Staff" : "Customer"),
    el("div", { class: "text-sm text-ivory truncate mb-3" }, name || ""),
    button("Log Out", {
      variant: "secondary",
      extraClass: "w-full !py-1.5 text-xs",
      onClick: () => {
        logout();
        navigate("/login");
      },
    }),
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
  const customerLinks =
    state.currentRole === "customer" ? [navLink("My Picks", "/my-picks", "◈"), navLink("My Account", "/account", "☺")] : [];

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
      sessionFooter(),
    ]
  );

  return el("div", { class: "flex min-h-screen" }, [sidebar, el("main", { class: "flex-1 min-w-0" }, contentNode)]);
}

let lastScrolledPath = null;

function scrollTopOnce() {
  const path = currentRoutePath();
  if (path !== lastScrolledPath) {
    window.scrollTo({ top: 0 });
    lastScrolledPath = path;
  }
}

// Authenticated app pages: sidebar + content.
function draw(contentNode) {
  mount(appRoot, shell(contentNode));
  // Only jump to top on an actual route change. Store mutations (approving a
  // date, saving bottling status, submitting the membership form, etc.) also
  // flow through this same draw() via the global subscribe-and-rerender
  // below, and on a long page that would yank the viewport away from
  // whatever the user just clicked.
  scrollTopOnce();
  requestAnimationFrame(() => initScrollReveal(appRoot));
}

// The login screen: full-bleed, no sidebar (there's nothing to navigate to yet).
function drawBare(contentNode) {
  mount(appRoot, contentNode);
  scrollTopOnce();
}

// Gates a route to the given role(s). Not logged in -> /login. Logged in as
// the wrong role -> onUnauthorized(). This is a client-side redirect only —
// see the note on STAFF_ACCESS_CODE in store.js — but it does mean a
// customer session can never render the staff views, even via a direct or
// bookmarked URL.
function requireRole(allowedRoles, onUnauthorized) {
  const role = getState().currentRole;
  if (role == null) {
    navigate("/login");
    return false;
  }
  if (!allowedRoles.includes(role)) {
    onUnauthorized();
    return false;
  }
  return true;
}

route("/login", () => {
  const role = getState().currentRole;
  if (role === "staff") return navigate("/dashboard");
  if (role === "customer") return navigate("/");
  drawBare(renderLogin());
});

route("/", () => {
  if (!requireRole(["customer", "staff"], () => {})) return;
  draw(renderMarketplace());
});
route("/inventory/new", () => {
  if (!requireRole(["staff"], () => navigate("/"))) return;
  draw(renderBarrelForm());
});
route("/inventory/upload", () => {
  if (!requireRole(["staff"], () => navigate("/"))) return;
  draw(renderInventoryUpload());
});
route("/pick/new/:barrelId", (params) => {
  if (!requireRole(["customer"], () => navigate("/dashboard"))) return;
  draw(renderPickWizard(params));
});
route("/pick/:id", (params) => {
  if (!requireRole(["customer", "staff"], () => {})) return;
  draw(renderPickDetail(params));
});
route("/my-picks", () => {
  if (!requireRole(["customer"], () => navigate("/dashboard"))) return;
  draw(renderMyPicks());
});
route("/account", () => {
  if (!requireRole(["customer"], () => navigate("/dashboard"))) return;
  draw(renderMyAccount());
});
route("/dashboard", () => {
  if (!requireRole(["staff"], () => navigate("/"))) return;
  draw(renderStaffDashboard());
});
notFoundRoute(() => {
  if (getState().currentRole == null) return navigate("/login");
  draw(el("div", { class: "p-10 text-ivory/50" }, "Page not found. ", el("a", { href: "#/", class: "text-gold underline" }, "Go home")));
});

subscribe(() => {
  // Full re-render on any state change keeps this simple at our scale.
  window.dispatchEvent(new HashChangeEvent("hashchange"));
});

startRouter();
