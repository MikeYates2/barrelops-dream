import { getState } from "../store.js";
import { el, badge, button, fmtMoney, card } from "../ui.js";
import { navigate } from "../router.js";

const STATUS_TONE = {
  available: ["Available", "green"],
  in_bottling: ["In Bottling", "amber"],
  not_available: ["Not Available", "red"],
  sold: ["Sold", "neutral"],
};

export function renderMarketplace() {
  const state = getState();
  let query = "";

  const wrap = el("div", { class: "p-8 max-w-[1400px] mx-auto" });

  function draw() {
    const barrels = state.barrels.filter((b) => {
      if (!query) return true;
      const hay = `${b.whiskeyType} ${b.distiller} ${b.warehouser} ${b.mashBill}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });

    const header = el("div", { class: "flex items-start justify-between gap-6 mb-6" }, [
      el("div", {}, [
        el("h1", { class: "text-2xl font-bold text-stone-900" }, "Marketplace"),
        el("p", { class: "text-sm text-stone-500 mt-1" }, "Browse available single barrels for your next pick."),
      ]),
      state.currentRole === "staff"
        ? el("div", { class: "flex gap-2" }, [
            button("Upload Inventory", { variant: "secondary", onClick: () => navigate("/inventory/upload") }),
            button("+ Add Barrel", { variant: "gold", onClick: () => navigate("/inventory/new") }),
          ])
        : card(
            [
              el("div", { class: "p-4 max-w-sm" }, [
                el("div", { class: "flex items-center gap-2 font-semibold text-stone-800 text-sm mb-1" }, [
                  el("span", {}, "🛡️"),
                  "Dream Spirits Assurance",
                ]),
                el(
                  "p",
                  { class: "text-xs text-stone-500 leading-relaxed" },
                  "Every barrel is reserved for one pick at a time. Start a pick to lock in samples or request an in-person tasting."
                ),
              ]),
            ],
            ""
          ),
    ]);

    const searchBar = el("div", { class: "mb-4" }, [
      el("input", {
        type: "search",
        placeholder: "Search listings, distillers, warehousers, mash bills...",
        value: query,
        class:
          "w-full max-w-xl rounded-lg border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600",
        oninput: (e) => {
          query = e.target.value;
          draw();
        },
      }),
    ]);

    const cols = [
      "Whiskey Type",
      "Age (Years)",
      "Distiller",
      "Warehouser",
      "Mash Bill (C/R/W/M)",
      "# of Barrels",
      "Price/Barrel",
      "Status",
      "Samples",
      "",
    ];

    const table = card(
      [
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
              barrels.length
                ? barrels.map((b) => {
                    const [statusLabel, statusTone] = STATUS_TONE[b.status] || STATUS_TONE.available;
                    return el("tr", { class: "border-b border-stone-100 hover:bg-stone-50" }, [
                      el("td", { class: "px-4 py-3 font-medium text-stone-800 whitespace-nowrap" }, b.whiskeyType),
                      el("td", { class: "px-4 py-3 text-stone-600" }, String(b.ageYears)),
                      el("td", { class: "px-4 py-3 text-stone-600 whitespace-nowrap" }, b.distiller),
                      el("td", { class: "px-4 py-3 text-stone-600 whitespace-nowrap" }, b.warehouser),
                      el("td", { class: "px-4 py-3 text-stone-600 whitespace-nowrap" }, b.mashBill),
                      el("td", { class: "px-4 py-3 text-stone-600" }, String(b.numBarrels)),
                      el("td", { class: "px-4 py-3 text-stone-800 font-medium whitespace-nowrap" }, fmtMoney(b.pricePerBarrel)),
                      el("td", { class: "px-4 py-3" }, badge(statusLabel, statusTone)),
                      el("td", { class: "px-4 py-3" }, badge(b.samplesAvailable ? "Available" : "Not Avail...", b.samplesAvailable ? "green" : "red")),
                      el("td", { class: "px-4 py-3 text-right whitespace-nowrap" }, [
                        state.currentRole === "customer" && b.status === "available"
                          ? button("Start a Pick", {
                              variant: "gold",
                              extraClass: "!py-1.5 !px-3 text-xs",
                              onClick: () => navigate(`/pick/new/${b.id}`),
                            })
                          : el("span", { class: "text-xs text-stone-400" }, b.status === "sold" ? "Sold" : "—"),
                      ]),
                    ]);
                  })
                : el("tr", {}, el("td", { class: "px-4 py-10 text-center text-stone-400", colSpan: cols.length }, "No barrels match your search."))
            ),
          ]),
        ]),
        el("div", { class: "px-4 py-3 border-t border-stone-100 text-xs text-stone-400" }, `Showing ${barrels.length} of ${state.barrels.length} entries`),
      ],
      ""
    );

    wrap.replaceChildren(header, searchBar, table);
  }

  draw();
  return wrap;
}
