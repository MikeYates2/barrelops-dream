import {
  getPick,
  getBarrel,
  getState,
  approveDate,
  uploadLogo,
  updateBottling,
  advanceToFulfillment,
  markListingComplete,
  PHASES,
} from "../store.js";
import { el, card, button, badge, fmtDate, fmtMoney, field, selectInput, textInput } from "../ui.js";

function phaseTracker(currentPhase) {
  return el(
    "div",
    { class: "flex items-center mb-8 overflow-x-auto pb-2" },
    PHASES.flatMap((p, i) => {
      const isDone = p.n < currentPhase;
      const isActive = p.n === currentPhase;
      const dot = el(
        "div",
        {
          class: `w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
            isDone ? "bg-emerald-600 text-white" : isActive ? "bg-amber-800 text-white" : "bg-stone-200 text-stone-500"
          }`,
        },
        isDone ? "✓" : String(p.n)
      );
      const item = el("div", { class: "flex flex-col items-center gap-1 shrink-0 w-28" }, [
        dot,
        el("span", { class: `text-[11px] text-center font-medium ${isActive ? "text-stone-900" : "text-stone-400"}` }, p.label),
      ]);
      return i < PHASES.length - 1 ? [item, el("div", { class: `flex-1 h-px min-w-[16px] ${isDone ? "bg-emerald-500" : "bg-stone-200"}` })] : [item];
    })
  );
}

function summaryCard(pick, barrel) {
  return card([
    el("div", { class: "p-5 space-y-4" }, [
      el("div", {}, [
        el("div", { class: "text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1" }, "Barrel"),
        el("div", { class: "font-semibold text-stone-800" }, `${barrel.whiskeyType} · ${barrel.ageYears} yrs`),
        el("div", { class: "text-sm text-stone-500" }, `${barrel.distiller} — ${barrel.warehouser}`),
        el("div", { class: "text-sm text-stone-500" }, `Mash bill ${barrel.mashBill} · ${fmtMoney(barrel.pricePerBarrel)}/barrel`),
      ]),
      el("div", {}, [
        el("div", { class: "text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1" }, "Contact"),
        el("div", { class: "text-sm text-stone-700" }, pick.contact.name),
        el("div", { class: "text-sm text-stone-500" }, pick.contact.email),
        el("div", { class: "text-sm text-stone-500" }, pick.contact.phone),
        el("div", { class: "text-sm text-stone-500" }, pick.contact.location),
        badge(pick.contact.groupType === "retailer" ? "Retailer" : "Private Group", "blue"),
      ]),
      el("div", {}, [
        el("div", { class: "text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1" }, "Pick Method"),
        badge(pick.pickMethod === "2B_in_person" ? "2B — In-Person Pick" : "2A — Ship Samples", "amber"),
      ]),
    ]),
  ]);
}

function actionPanel(pick, barrel, role, refresh) {
  const panels = [];

  // Phase 2: staff approves a customer-requested in-person date
  if (pick.pickMethod === "2B_in_person" && pick.dateStatus === "pending") {
    if (role === "staff") {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Approve a Pick Date"),
            el("p", { class: "text-sm text-stone-500 mb-4" }, "The customer requested the following dates. Approve one to confirm the visit."),
            el(
              "div",
              { class: "flex flex-wrap gap-2" },
              pick.requestedDates.map((d) =>
                button(fmtDate(d), {
                  variant: "secondary",
                  onClick: () => {
                    approveDate(pick.id, d);
                    refresh();
                  },
                })
              )
            ),
          ]),
        ])
      );
    } else {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Waiting on date approval"),
            el("p", { class: "text-sm text-stone-500" }, "Dream Spirits staff will confirm one of your requested dates:"),
            el("div", { class: "flex flex-wrap gap-2 mt-3" }, pick.requestedDates.map((d) => badge(fmtDate(d), "neutral"))),
          ]),
        ])
      );
    }
  }

  if (pick.pickMethod === "2B_in_person" && pick.dateStatus === "approved" && pick.phase === 3 && !pick.logo) {
    panels.push(
      card([
        el("div", { class: "p-5 flex items-center gap-2" }, [
          badge("Date Confirmed", "green"),
          el("span", { class: "text-sm text-stone-600" }, `Visit confirmed for ${fmtDate(pick.approvedDate)}.`),
        ]),
      ])
    );
  }

  // Phase 3: label creation — customer uploads logo
  if (pick.phase === 3 || (pick.phase >= 4 && pick.logo)) {
    if (!pick.logo && role === "customer") {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Upload Your Logo"),
            el("p", { class: "text-sm text-stone-500 mb-4" }, "Upload a logo (JPG or PNG) for your custom label."),
            el("input", {
              type: "file",
              accept: "image/png,image/jpeg",
              class: "text-sm",
              onchange: (e) => {
                const file = e.target.files[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) {
                  alert("Logo file must be under 5MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => {
                  uploadLogo(pick.id, { fileName: file.name, dataUrl: String(reader.result), uploadedAt: new Date().toISOString() });
                  refresh();
                };
                reader.readAsDataURL(file);
              },
            }),
          ]),
        ])
      );
    } else if (!pick.logo && role === "staff") {
      panels.push(
        card([el("div", { class: "p-5" }, [el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Waiting on Logo"), el("p", { class: "text-sm text-stone-500" }, "Customer has not uploaded a logo yet.")])])
      );
    } else if (pick.logo) {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-2" }, "Label Logo"),
            el("img", { src: pick.logo.dataUrl, class: "max-h-32 rounded-lg border border-stone-200 mb-2" }),
            el("div", { class: "text-xs text-stone-400" }, pick.logo.fileName),
          ]),
        ])
      );
    }
  }

  // Phase 4: bottling — staff updates status
  if (pick.phase === 4) {
    if (role === "staff") {
      let statusVal = pick.bottling.status;
      let countVal = pick.bottling.bottleCount ?? "";
      let notesVal = pick.bottling.notes ?? "";
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Update Bottling Status"),
            el("p", { class: "text-sm text-stone-500 mb-4" }, "Updating this also reflects on the barrel listing in the marketplace."),
            el("div", { class: "grid grid-cols-2 gap-4" }, [
              field(
                "Bottling Status",
                selectInput(
                  [
                    { value: "not_started", label: "Not Started" },
                    { value: "in_progress", label: "In Progress" },
                    { value: "complete", label: "Complete" },
                  ],
                  { value: statusVal, onchange: (e) => (statusVal = e.target.value) }
                )
              ),
              field("Bottle Count", textInput({ type: "number", min: "0", value: countVal, oninput: (e) => (countVal = e.target.value) })),
            ]),
            field("Notes", textInput({ type: "text", value: notesVal, placeholder: "Optional notes", oninput: (e) => (notesVal = e.target.value) })),
            el("div", { class: "flex gap-3 pt-4" }, [
              button("Save Status", {
                variant: "secondary",
                onClick: () => {
                  updateBottling(pick.id, { status: statusVal, bottleCount: countVal ? Number(countVal) : null, notes: notesVal });
                  refresh();
                },
              }),
              button("Save & Advance to Payment & Fulfillment", {
                variant: "gold",
                onClick: () => {
                  updateBottling(pick.id, { status: statusVal, bottleCount: countVal ? Number(countVal) : null, notes: notesVal });
                  advanceToFulfillment(pick.id);
                  refresh();
                },
              }),
            ]),
          ]),
        ])
      );
    } else {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-2" }, "Bottling Status"),
            badge(
              pick.bottling.status === "complete" ? "Complete" : pick.bottling.status === "in_progress" ? "In Progress" : "Not Started",
              pick.bottling.status === "complete" ? "green" : "amber"
            ),
            pick.bottling.bottleCount ? el("div", { class: "text-sm text-stone-500 mt-2" }, `${pick.bottling.bottleCount} bottles`) : null,
          ]),
        ])
      );
    }
  }

  // Phase 5: payment & fulfillment — staff marks listing complete
  if (pick.phase === 5) {
    if (role === "staff") {
      panels.push(
        card([
          el("div", { class: "p-5" }, [
            el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Payment & Fulfillment"),
            el("p", { class: "text-sm text-stone-500 mb-4" }, "Once payment is settled and the order has shipped, mark this listing complete."),
            button("Mark Public Listing Complete", {
              variant: "gold",
              onClick: () => {
                markListingComplete(pick.id);
                refresh();
              },
            }),
          ]),
        ])
      );
    } else {
      panels.push(
        card([el("div", { class: "p-5" }, [el("h3", { class: "font-semibold text-stone-900 mb-1" }, "Payment & Fulfillment"), el("p", { class: "text-sm text-stone-500" }, "Your order is in payment & fulfillment. Dream Spirits will update this once it ships.")])])
      );
    }
  }

  if (pick.phase === 6) {
    panels.push(
      card([
        el("div", { class: "p-5 flex items-center gap-2" }, [badge("Complete", "green"), el("span", { class: "text-sm text-stone-600" }, "This barrel pick is complete.")]),
      ])
    );
  }

  return el("div", { class: "space-y-4" }, panels);
}

export function renderPickDetail({ id }) {
  const wrap = el("div", { class: "p-8 max-w-4xl mx-auto" });

  function refresh() {
    const pick = getPick(id);
    const state = getState();
    if (!pick) {
      wrap.replaceChildren(el("p", { class: "text-stone-500" }, "Pick not found."));
      return;
    }
    const barrel = getBarrel(pick.barrelId);
    wrap.replaceChildren(
      el("a", { href: state.currentRole === "staff" ? "#/dashboard" : "#/my-picks", class: "text-xs text-amber-700 hover:underline" }, "← Back"),
      el("h1", { class: "text-2xl font-bold text-stone-900 mt-2 mb-1" }, `Pick ${pick.id.slice(-6).toUpperCase()}`),
      el("p", { class: "text-sm text-stone-500 mb-6" }, `Created ${fmtDate(pick.createdAt)}`),
      phaseTracker(pick.phase),
      el("div", { class: "grid grid-cols-3 gap-6" }, [
        el("div", { class: "col-span-2" }, actionPanel(pick, barrel, state.currentRole, refresh)),
        el("div", { class: "col-span-1" }, summaryCard(pick, barrel)),
      ])
    );
  }

  refresh();
  return wrap;
}
