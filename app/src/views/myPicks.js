import { getState, getBarrel, picksForCustomer, PHASES } from "../store.js";
import { el, card, badge, fmtDate } from "../ui.js";

export function renderMyPicks() {
  const state = getState();
  const email = state.currentCustomerEmail;

  if (!email) {
    return el("div", { class: "px-8 py-16 max-w-2xl mx-auto" }, [
      el("h1", { class: "font-serif text-4xl text-ivory mb-2" }, "My Picks"),
      card([
        el(
          "div",
          { class: "p-6 text-sm text-ivory/45" },
          "We couldn't find an email on your account. Try logging out and back in, or start a new pick from the Marketplace."
        ),
      ]),
    ]);
  }

  const picks = picksForCustomer(email);

  return el("div", { class: "px-8 py-16 max-w-4xl mx-auto" }, [
    el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "My Picks"),
    el("p", { class: "text-sm text-ivory/40 mb-8" }, `Showing picks for ${email}`),
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
                el("div", { class: "p-5 flex items-center justify-between" }, [
                  el("div", {}, [
                    el("div", { class: "font-serif text-lg text-ivory" }, barrel ? barrel.sku : "Barrel unavailable"),
                    el("div", { class: "text-xs text-ivory/35" }, `Started ${fmtDate(p.createdAt)}`),
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
      : card([
          el("div", { class: "p-6 text-sm text-ivory/45" }, [
            "No picks yet. ",
            el("a", { href: "#/", class: "text-gold underline" }, "Browse the marketplace"),
            " to start one.",
          ]),
        ]),
  ]);
}
