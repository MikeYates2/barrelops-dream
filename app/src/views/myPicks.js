import { getState, getBarrel, picksForCustomer, PHASES } from "../store.js";
import { el, card, badge, fmtDate } from "../ui.js";

export function renderMyPicks() {
  const state = getState();
  const email = state.currentCustomerEmail;

  if (!email) {
    return el("div", { class: "p-8 max-w-2xl" }, [
      el("h1", { class: "text-2xl font-bold text-stone-900 mb-2" }, "My Picks"),
      card([
        el(
          "div",
          { class: "p-6 text-sm text-stone-500" },
          "Enter your email in the sidebar under “Viewing as” to see your barrel picks, or start a new pick from the Marketplace."
        ),
      ]),
    ]);
  }

  const picks = picksForCustomer(email);

  return el("div", { class: "p-8 max-w-4xl mx-auto" }, [
    el("h1", { class: "text-2xl font-bold text-stone-900 mb-1" }, "My Picks"),
    el("p", { class: "text-sm text-stone-500 mb-6" }, `Showing picks for ${email}`),
    picks.length
      ? el(
          "div",
          { class: "space-y-3" },
          picks.map((p) => {
            const barrel = getBarrel(p.barrelId);
            const phaseInfo = PHASES.find((ph) => ph.n === p.phase);
            return el(
              "a",
              { href: `#/pick/${p.id}`, class: "block" },
              card([
                el("div", { class: "p-4 flex items-center justify-between" }, [
                  el("div", {}, [
                    el("div", { class: "font-semibold text-stone-800" }, barrel ? `${barrel.whiskeyType} · ${barrel.ageYears} yrs` : "Barrel unavailable"),
                    el("div", { class: "text-xs text-stone-400" }, `Started ${fmtDate(p.createdAt)}`),
                  ]),
                  el("div", { class: "flex items-center gap-2" }, [
                    p.pickMethod === "2B_in_person" ? badge("In-Person", "blue") : badge("Ship Samples", "blue"),
                    badge(phaseInfo ? phaseInfo.label : "—", p.phase === 6 ? "green" : "amber"),
                  ]),
                ]),
              ])
            );
          })
        )
      : card([el("div", { class: "p-6 text-sm text-stone-500" }, ["No picks yet. ", el("a", { href: "#/", class: "text-amber-700 underline" }, "Browse the marketplace"), " to start one."])]),
  ]);
}
