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
import { el, card, button, badge, fmtDate, fmtStayWindow, fmtMoney, field, selectInput, textInput } from "../ui.js";

function phaseTracker(currentPhase) {
  return el(
    "div",
    { class: "flex items-center mb-10 overflow-x-auto pb-2" },
    PHASES.flatMap((p, i) => {
      const isDone = p.n < currentPhase;
      const isActive = p.n === currentPhase;
      const dot = el(
        "div",
        {
          class: `w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            isDone
              ? "bg-ivory text-noir"
              : isActive
              ? "bg-gradient-to-b from-gold-light to-gold-dark text-noir shadow-[0_0_14px_rgba(201,168,106,0.4)]"
              : "bg-white/[0.06] text-ivory/35 border border-white/10"
          }`,
        },
        isDone ? "✓" : String(p.n)
      );
      const item = el("div", { class: "flex flex-col items-center gap-1.5 shrink-0 w-28" }, [
        dot,
        el("span", { class: `text-[11px] text-center tracking-wide ${isActive ? "text-ivory" : "text-ivory/35"}` }, p.label),
      ]);
      return i < PHASES.length - 1
        ? [item, el("div", { class: `flex-1 h-px min-w-[16px] ${isDone ? "bg-ivory/50" : "bg-white/10"}` })]
        : [item];
    })
  );
}

function summaryCard(pick, barrel) {
  return card([
    el("div", { class: "p-6 space-y-5" }, [
      el("div", {}, [
        el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5" }, "Barrel"),
        el("div", { class: "font-serif text-xl text-ivory leading-snug" }, barrel.sku),
        barrel.distilledWhen ? el("div", { class: "text-sm text-ivory/45" }, `Distilled ${barrel.distilledWhen}`) : null,
        el("div", { class: "text-sm text-ivory/45" }, `Private Group ${fmtMoney(barrel.privateGroupPricing)} · Retail ${fmtMoney(barrel.retailMsrp)} /bottle`),
      ]),
      el("div", { class: "h-px bg-white/10" }),
      el("div", {}, [
        el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5" }, "Contact"),
        el("div", { class: "text-sm text-ivory/80" }, pick.contact.name),
        el("div", { class: "text-sm text-ivory/45" }, pick.contact.email),
        el("div", { class: "text-sm text-ivory/45" }, pick.contact.phone),
        el("div", { class: "text-sm text-ivory/45 mb-2" }, pick.contact.location),
        el("div", { class: "flex items-center gap-2 flex-wrap" }, [
          badge(pick.contact.groupType === "retailer" ? "Retailer" : "Private Group", "blue"),
          pick.contact.groupType === "retailer" && pick.contact.retailerState
            ? badge(`Licensed in ${pick.contact.retailerState}`, "neutral")
            : null,
        ]),
      ]),
      el("div", { class: "h-px bg-white/10" }),
      el("div", {}, [
        el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5" }, "Pick Method"),
        badge(pick.pickMethod === "2B_in_person" ? "In-Person Pick" : "Ship Samples", "gold"),
        pick.pickMethod === "2B_in_person" && pick.houseRulesAcknowledged
          ? el("div", { class: "text-xs text-ivory/35 mt-2" }, "✓ Acknowledged $5,000 minimum-barrel policy")
          : null,
      ]),
      pick.shippingAddress
        ? el("div", {}, [
            el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5 mt-3" }, "Shipping Address"),
            el("div", { class: "text-sm text-ivory/45" }, pick.shippingAddress.street),
            el(
              "div",
              { class: "text-sm text-ivory/45" },
              `${pick.shippingAddress.city}, ${pick.shippingAddress.state} ${pick.shippingAddress.zip}`
            ),
          ])
        : null,
      pick.sampleBarrelIds && pick.sampleBarrelIds.length
        ? el("div", {}, [
            el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5 mt-3" }, `Samples Requested (${pick.sampleBarrelIds.length})`),
            el(
              "ul",
              { class: "space-y-1" },
              pick.sampleBarrelIds.map((id) => {
                const b = getBarrel(id);
                return el("li", { class: "text-sm text-ivory/45" }, b ? b.sku : "Barrel unavailable");
              })
            ),
          ])
        : null,
    ]),
  ]);
}

function panelHeading(title, subtitle) {
  return [
    el("h3", { class: "font-serif text-xl text-ivory mb-1" }, title),
    subtitle ? el("p", { class: "text-sm text-ivory/40 mb-4" }, subtitle) : null,
  ];
}

function actionPanel(pick, barrel, role, refresh) {
  const panels = [];

  // Phase 2: staff approves a customer-requested in-person date
  if (pick.pickMethod === "2B_in_person" && pick.dateStatus === "pending") {
    if (role === "staff") {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            ...panelHeading("Approve a Pick Date", "The customer requested the following 2-night stay windows. Approve one to confirm the visit."),
            el(
              "div",
              { class: "flex flex-wrap gap-2" },
              pick.requestedDates.map((d) =>
                button(fmtStayWindow(d), {
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
          el("div", { class: "p-6" }, [
            ...panelHeading("Waiting on date approval", "Dream Spirits staff will confirm one of your requested stay windows:"),
            el("div", { class: "flex flex-wrap gap-2 mt-1" }, pick.requestedDates.map((d) => badge(fmtStayWindow(d), "neutral"))),
          ]),
        ])
      );
    }
  }

  if (pick.pickMethod === "2B_in_person" && pick.dateStatus === "approved" && pick.phase === 3 && !pick.logo) {
    panels.push(
      card([
        el("div", { class: "p-6 flex items-center gap-3" }, [
          badge("Date Confirmed", "green"),
          el("span", { class: "text-sm text-ivory/60" }, `Visit confirmed: ${fmtStayWindow(pick.approvedDate)}.`),
        ]),
      ])
    );
  }

  // Phase 3: label creation — customer uploads logo
  if (pick.phase === 3 || (pick.phase >= 4 && pick.logo)) {
    if (!pick.logo && role === "customer") {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            ...panelHeading("Upload Your Logo", "Upload a logo (JPG or PNG) for your custom label."),
            el("input", {
              type: "file",
              accept: "image/png,image/jpeg",
              class: "text-sm text-ivory/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold/15 file:text-gold-light file:text-xs file:font-medium hover:file:bg-gold/25 file:cursor-pointer cursor-pointer",
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
      panels.push(card([el("div", { class: "p-6" }, panelHeading("Waiting on Logo", "Customer has not uploaded a logo yet."))]));
    } else if (pick.logo) {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            el("h3", { class: "font-serif text-xl text-ivory mb-3" }, "Label Logo"),
            el("img", { src: pick.logo.dataUrl, class: "max-h-32 rounded-lg border border-white/10 mb-2 bg-white/5 p-2" }),
            el("div", { class: "text-xs text-ivory/35" }, pick.logo.fileName),
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
          el("div", { class: "p-6" }, [
            ...panelHeading("Update Bottling Status", "Updating this also reflects on the barrel listing in the marketplace."),
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
            el("div", { class: "mt-4" }, field("Notes", textInput({ type: "text", value: notesVal, placeholder: "Optional notes", oninput: (e) => (notesVal = e.target.value) }))),
            el("div", { class: "flex gap-3 pt-6" }, [
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
          el("div", { class: "p-6" }, [
            el("h3", { class: "font-serif text-xl text-ivory mb-3" }, "Bottling Status"),
            badge(
              pick.bottling.status === "complete" ? "Complete" : pick.bottling.status === "in_progress" ? "In Progress" : "Not Started",
              pick.bottling.status === "complete" ? "green" : "amber"
            ),
            pick.bottling.bottleCount ? el("div", { class: "text-sm text-ivory/45 mt-2" }, `${pick.bottling.bottleCount} bottles`) : null,
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
          el("div", { class: "p-6" }, [
            ...panelHeading("Payment & Fulfillment", "Once payment is settled and the order has shipped, mark this listing complete."),
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
        card([
          el(
            "div",
            { class: "p-6" },
            panelHeading("Payment & Fulfillment", "Your order is in payment & fulfillment. Dream Spirits will update this once it ships.")
          ),
        ])
      );
    }
  }

  if (pick.phase === 6) {
    panels.push(
      card([
        el("div", { class: "p-6 flex items-center gap-3" }, [badge("Complete", "green"), el("span", { class: "text-sm text-ivory/60" }, "This barrel pick is complete.")]),
      ])
    );
  }

  return el("div", { class: "space-y-4" }, panels);
}

export function renderPickDetail({ id }) {
  const wrap = el("div", { class: "px-8 py-16 max-w-4xl mx-auto" });

  function refresh() {
    const pick = getPick(id);
    const state = getState();
    if (!pick) {
      wrap.replaceChildren(el("p", { class: "text-ivory/40" }, "Pick not found."));
      return;
    }
    const barrel = getBarrel(pick.barrelId);
    wrap.replaceChildren(
      el("a", { href: state.currentRole === "staff" ? "#/dashboard" : "#/my-picks", class: "text-xs text-gold/70 hover:text-gold transition-colors" }, "← Back"),
      el("h1", { class: "font-serif text-4xl text-ivory mt-3 mb-1" }, `Pick ${pick.id.slice(-6).toUpperCase()}`),
      el("p", { class: "text-sm text-ivory/35 mb-8" }, `Created ${fmtDate(pick.createdAt)}`),
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
