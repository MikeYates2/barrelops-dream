import { getState, getBarrel, PHASES, returnPickToInventory, pendingCustomerProfiles, approveCustomerProfile } from "../store.js";
import { el, card, badge, button, fmtDate } from "../ui.js";

export function renderStaffDashboard() {
  const state = getState();
  let phaseFilter = "all";
  // Id of the pick currently showing its inline "are you sure" prompt in
  // place of the Return to Inventory button — at most one at a time.
  let confirmingId = null;

  const wrap = el("div", { class: "px-8 py-16 max-w-6xl mx-auto" });

  function draw() {
    const picks = state.picks
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((p) => (phaseFilter === "all" ? true : String(p.phase) === phaseFilter));

    const needsAttention = state.picks.filter((p) => p.pickMethod === "2B_in_person" && p.dateStatus === "pending");
    const membershipRequests = state.membershipRequests || [];
    const pendingProfiles = pendingCustomerProfiles();

    const filterBar = el(
      "div",
      { class: "flex flex-wrap gap-2 mb-8" },
      [{ n: "all", label: "All" }, ...PHASES].map((p) =>
        el("button", {
          class: `px-3.5 py-1.5 rounded-full text-xs tracking-wide border transition-colors ${
            phaseFilter === String(p.n)
              ? "bg-gold text-noir font-semibold border-gold"
              : "bg-white/[0.03] text-ivory/50 border-white/10 hover:border-gold/30 hover:text-ivory"
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
            el("div", { class: "p-5" }, [
              el("div", { class: "flex items-center gap-2 font-medium text-gold-light text-sm mb-3" }, [
                el("span", {}, "⏳"),
                `${needsAttention.length} pick(s) waiting on date approval`,
              ]),
              el(
                "div",
                { class: "flex flex-wrap gap-3" },
                needsAttention.map((p) =>
                  el(
                    "a",
                    { href: `#/pick/${p.id}`, class: "text-xs text-gold/80 hover:text-gold underline underline-offset-2" },
                    `${p.contact.name} — ${p.requestedDates.length} date(s) requested`
                  )
                )
              ),
            ]),
          ],
          "mb-4"
        )
      : null;

    const pendingProfilesCard = pendingProfiles.length
      ? card(
          [
            el("div", { class: "p-5" }, [
              el("div", { class: "flex items-center gap-2 font-medium text-gold-light text-sm mb-3" }, [
                el("span", {}, "☺"),
                `${pendingProfiles.length} customer account(s) awaiting approval`,
              ]),
              el(
                "div",
                { class: "space-y-2" },
                pendingProfiles.map((c) =>
                  el("div", { class: "flex items-center justify-between gap-3 flex-wrap" }, [
                    el("span", { class: "text-xs text-ivory/60" }, [
                      el("span", { class: "text-ivory" }, c.name || "(no name)"),
                      ` <${c.email}> · ${c.groupType === "retailer" ? "Retailer" : "Private Group"}`,
                    ]),
                    button("Approve", {
                      variant: "secondary",
                      extraClass: "!px-3 !py-1.5 !text-xs",
                      onClick: () => {
                        approveCustomerProfile(c.email);
                        draw();
                      },
                    }),
                  ])
                )
              ),
            ]),
          ],
          "mb-4"
        )
      : null;

    const membershipCard = membershipRequests.length
      ? card(
          [
            el("div", { class: "p-5" }, [
              el("div", { class: "flex items-center gap-2 font-medium text-ivory text-sm mb-3" }, [
                el("span", { class: "text-gold" }, "✦"),
                `${membershipRequests.length} membership request(s) from the Circle CTA`,
              ]),
              el(
                "div",
                { class: "flex flex-wrap gap-3" },
                membershipRequests
                  .slice()
                  .reverse()
                  .map((r) => el("span", { class: "text-xs text-ivory/50" }, `${r.name} <${r.email}> · ${fmtDate(r.requestedAt)}`))
              ),
            ]),
          ],
          "mb-8"
        )
      : null;

    const cols = ["Barrel", "Customer", "Type", "Method", "Phase", "Created", "", ""];

    const table = card(
      [
        el("div", { class: "overflow-x-auto" }, [
          el("table", { class: "w-full text-sm" }, [
            el(
              "thead",
              {},
              el(
                "tr",
                { class: "border-b border-white/10 text-left text-[10px] font-semibold text-ivory/35 uppercase tracking-[0.15em]" },
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
                    return el("tr", { class: "border-b border-white/5 hover:bg-white/[0.03]" }, [
                      el("td", { class: "px-4 py-3 font-medium text-ivory max-w-[16rem] truncate" }, barrel ? barrel.sku : "—"),
                      el("td", { class: "px-4 py-3 text-ivory/60 whitespace-nowrap" }, p.contact.name),
                      el("td", { class: "px-4 py-3" }, badge(p.contact.groupType === "retailer" ? "Retailer" : "Private Group", "blue")),
                      el("td", { class: "px-4 py-3 text-ivory/50 whitespace-nowrap" }, p.pickMethod === "2B_in_person" ? "In-Person" : "Ship Samples"),
                      el("td", { class: "px-4 py-3" }, badge(phaseInfo ? phaseInfo.label : "—", p.phase === 7 ? "green" : "amber")),
                      el("td", { class: "px-4 py-3 text-ivory/40 whitespace-nowrap" }, fmtDate(p.createdAt)),
                      el("td", { class: "px-4 py-3 text-right" }, el("a", { href: `#/pick/${p.id}`, class: "text-xs text-gold/80 hover:text-gold underline underline-offset-2" }, "View")),
                      el(
                        "td",
                        { class: "px-4 py-3 text-right whitespace-nowrap" },
                        confirmingId === p.id
                          ? el("div", { class: "flex items-center justify-end gap-2" }, [
                              el("span", { class: "text-xs text-ivory/50" }, "Delete pick?"),
                              button("Confirm", {
                                variant: "danger",
                                extraClass: "!px-3 !py-1.5 !text-xs",
                                onClick: () => {
                                  returnPickToInventory(p.id);
                                  confirmingId = null;
                                  draw();
                                },
                              }),
                              button("Cancel", {
                                variant: "ghost",
                                extraClass: "!px-3 !py-1.5 !text-xs",
                                onClick: () => {
                                  confirmingId = null;
                                  draw();
                                },
                              }),
                            ])
                          : button("Return to Inventory", {
                              variant: "danger",
                              extraClass: "!px-3 !py-1.5 !text-xs",
                              onClick: () => {
                                confirmingId = p.id;
                                draw();
                              },
                            })
                      ),
                    ]);
                  })
                : el("tr", {}, el("td", { class: "px-4 py-10 text-center text-ivory/30", colSpan: cols.length }, "No picks in this stage."))
            ),
          ]),
        ]),
      ],
      "",
      { glare: false }
    );

    wrap.replaceChildren(
      el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "Dashboard"),
      el("p", { class: "text-sm text-ivory/40 mb-8" }, "All active barrel picks across every customer."),
      // Node.replaceChildren() (unlike our el() helper) doesn't skip null
      // args — it stringifies them to the literal text "null" — so filter
      // out the panels that have nothing to show first.
      ...[pendingProfilesCard, attentionCard, membershipCard, filterBar, table].filter(Boolean)
    );
  }

  draw();
  return wrap;
}
