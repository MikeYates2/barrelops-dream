import { getState, getBarrel, PHASES } from "../store.js";
import { el, card, badge, fmtDate } from "../ui.js";

export function renderStaffDashboard() {
  const state = getState();
  let phaseFilter = "all";

  const wrap = el("div", { class: "p-8 max-w-6xl mx-auto" });

  function draw() {
    const picks = state.picks
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((p) => (phaseFilter === "all" ? true : String(p.phase) === phaseFilter));

    const needsAttention = state.picks.filter((p) => p.pickMethod === "2B_in_person" && p.dateStatus === "pending");

    const filterBar = el(
      "div",
      { class: "flex flex-wrap gap-2 mb-6" },
      [{ n: "all", label: "All" }, ...PHASES].map((p) =>
        el("button", {
          class: `px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            phaseFilter === String(p.n)
              ? "bg-stone-900 text-white border-stone-900"
              : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
          }`,
          textContent: p.label,
          onclick: () => {
            phaseFilter = String(p.n);
            draw();
          },
        })
      )
    );

    const attentionCard = needsAttention.length
      ? card(
          [
            el("div", { class: "p-4" }, [
              el("div", { class: "flex items-center gap-2 font-semibold text-amber-800 text-sm mb-2" }, [
                el("span", {}, "⏳"),
                `${needsAttention.length} pick(s) waiting on date approval`,
              ]),
              el(
                "div",
                { class: "flex flex-wrap gap-2" },
                needsAttention.map((p) =>
                  el(
                    "a",
                    { href: `#/pick/${p.id}`, class: "text-xs text-amber-700 underline" },
                    `${p.contact.name} — ${p.requestedDates.length} date(s) requested`
                  )
                )
              ),
            ]),
          ],
          "mb-6 border-amber-300 bg-amber-50/40"
        )
      : null;

    const cols = ["Barrel", "Customer", "Type", "Method", "Phase", "Created", ""];

    const table = card([
      el("div", { class: "overflow-x-auto" }, [
        el("table", { class: "w-full text-sm" }, [
          el(
            "thead",
            {},
            el(
              "tr",
              { class: "border-b border-stone-200 text-left text-[11px] font-semibold text-stone-400 uppercase tracking-wide" },
              cols.map((c) => el("th", { class: "px-4 py-3 whitespace-nowrap" }, c))
            )
          ),
          el(
            "tbody",
            {},
            picks.length
              ? picks.map((p) => {
                  const barrel = getBarrel(p.barrelId);
                  const phaseInfo = PHASES.find((ph) => ph.n === p.phase);
                  return el("tr", { class: "border-b border-stone-100 hover:bg-stone-50" }, [
                    el("td", { class: "px-4 py-3 font-medium text-stone-800 whitespace-nowrap" }, barrel ? `${barrel.whiskeyType} · ${barrel.ageYears}yrs` : "—"),
                    el("td", { class: "px-4 py-3 text-stone-600 whitespace-nowrap" }, p.contact.name),
                    el("td", { class: "px-4 py-3" }, badge(p.contact.groupType === "retailer" ? "Retailer" : "Private Group", "blue")),
                    el("td", { class: "px-4 py-3 text-stone-500 whitespace-nowrap" }, p.pickMethod === "2B_in_person" ? "In-Person" : "Ship Samples"),
                    el("td", { class: "px-4 py-3" }, badge(phaseInfo ? phaseInfo.label : "—", p.phase === 6 ? "green" : "amber")),
                    el("td", { class: "px-4 py-3 text-stone-500 whitespace-nowrap" }, fmtDate(p.createdAt)),
                    el("td", { class: "px-4 py-3 text-right" }, el("a", { href: `#/pick/${p.id}`, class: "text-xs text-amber-700 underline" }, "View")),
                  ]);
                })
              : el("tr", {}, el("td", { class: "px-4 py-10 text-center text-stone-400", colSpan: cols.length }, "No picks in this stage."))
          ),
        ]),
      ]),
    ]);

    wrap.replaceChildren(
      el("h1", { class: "text-2xl font-bold text-stone-900 mb-1" }, "Dashboard"),
      el("p", { class: "text-sm text-stone-500 mb-6" }, "All active barrel picks across every customer."),
      attentionCard,
      filterBar,
      table
    );
  }

  draw();
  return wrap;
}
