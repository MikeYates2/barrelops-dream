import {
  getPick,
  getBarrel,
  getState,
  approveDate,
  uploadLogo,
  updateBottling,
  advanceToFulfillment,
  markListingComplete,
  setSampleTracking,
  submitFinalSampleSelections,
  approveFinalSampleSelections,
  advanceToLabelCreation,
  advanceToBottling,
  goToPreviousPhase,
  minPickPhase,
  PHASES,
} from "../store.js";
import { el, card, button, badge, fmtDate, fmtStayWindow, fmtMoney, field, selectInput, textInput } from "../ui.js";
import { renderSampleSelector } from "../components/sampleSelector.js";

// Every step is clickable — completed, current or upcoming — so anyone can
// look back at (or ahead to) a step without changing the pick. The step being
// viewed gets a ring when it differs from the pick's real current phase.
function phaseTracker(currentPhase, viewedPhase, onSelect) {
  return el(
    "div",
    { class: "flex items-center mb-10 overflow-x-auto pb-2" },
    PHASES.flatMap((p, i) => {
      const isDone = p.n < currentPhase;
      const isActive = p.n === currentPhase;
      const isViewed = p.n === viewedPhase;
      const dot = el(
        "div",
        {
          class: `w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold transition-all group-hover:scale-110 ${
            isDone
              ? "bg-ivory text-noir"
              : isActive
              ? "bg-gradient-to-b from-gold-light to-gold-dark text-noir shadow-[0_0_14px_rgba(201,168,106,0.4)]"
              : "bg-white/[0.06] text-ivory/35 border border-white/10"
          } ${isViewed ? "ring-2 ring-gold-light ring-offset-2 ring-offset-black" : ""}`,
        },
        isDone ? "✓" : String(p.n)
      );
      const item = el(
        "button",
        {
          type: "button",
          title: `View ${p.label}`,
          "aria-label": `View ${p.label}`,
          "aria-current": isViewed || (isActive && viewedPhase == null) ? "step" : null,
          class: "group flex flex-col items-center gap-1.5 shrink-0 w-28 cursor-pointer focus:outline-none",
          onclick: () => onSelect(p.n),
        },
        [
          dot,
          el(
            "span",
            { class: `text-[11px] text-center tracking-wide transition-colors group-hover:text-ivory ${isViewed || (isActive && viewedPhase == null) ? "text-ivory" : "text-ivory/35"}` },
            p.label
          ),
        ]
      );
      return i < PHASES.length - 1
        ? [item, el("div", { class: `flex-1 h-px min-w-[16px] ${isDone ? "bg-ivory/50" : "bg-white/10"}` })]
        : [item];
    })
  );
}

function summaryCard(pick, barrel) {
  return card([
    el("div", { class: "p-6 space-y-5" }, [
      // Picks no longer start from a single reserved barrel — an in-person
      // visit has none until it happens on-site, and a ship-samples pick's
      // barrels are listed separately below ("Samples Requested").
      barrel
        ? el("div", {}, [
            el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1.5" }, "Barrel"),
            el("div", { class: "font-serif text-xl text-ivory leading-snug" }, barrel.sku),
            barrel.distilledWhen ? el("div", { class: "text-sm text-ivory/45" }, `Distilled ${barrel.distilledWhen}`) : null,
            el("div", { class: "text-sm text-ivory/45" }, `Private Group ${fmtMoney(barrel.privateGroupPricing)} · Retail ${fmtMoney(barrel.retailMsrp)} /bottle`),
          ])
        : null,
      barrel ? el("div", { class: "h-px bg-white/10" }) : null,
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

const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"];

// File picker that saves the chosen file as the pick's label logo. Used for
// the first upload and again for replacing it — uploadLogo overwrites the
// stored logo and only advances the phase if it hasn't reached Bottling yet.
function logoFileInput(pick, refresh) {
  return el("input", {
    type: "file",
    accept: LOGO_ALLOWED_TYPES.join(","),
    class: "text-sm text-ivory/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold/15 file:text-gold-light file:text-xs file:font-medium hover:file:bg-gold/25 file:cursor-pointer cursor-pointer",
    onchange: (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
        alert("Please upload a PNG, JPG, SVG, or PDF file.");
        e.target.value = "";
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Logo file must be under 5MB.");
        e.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        uploadLogo(pick.id, { fileName: file.name, fileType: file.type, dataUrl: String(reader.result), uploadedAt: new Date().toISOString() });
        refresh();
      };
      reader.readAsDataURL(file);
    },
  });
}

// The Dream Spirits label artwork with the customer's logo composited into
// its blank "Dreamt Up Exclusively For" box. The box position is measured
// from label-template.png (1600x1010): centered at ~(1304, 268), ~487x168,
// tilted -0.7deg like the rest of the artwork, so it's expressed in
// percentages and scales with the image. A PDF can't be drawn as an <img>,
// so it gets a text placeholder in the box instead.
function labelPreviewCard(logo, title, subtitle) {
  const logoNode = !logo
    ? null
    : logo.fileType === "application/pdf"
    ? el("span", { class: "text-[11px] sm:text-sm font-medium text-noir/70 tracking-wide" }, `PDF logo: ${logo.fileName}`)
    : el("img", { src: logo.dataUrl, alt: "Your logo", class: "max-w-full max-h-full object-contain" });
  return card([
    el("div", { class: "p-6" }, [
      ...panelHeading(title, subtitle),
      el("div", { class: "relative" }, [
        el("img", { src: "/src/assets/label-template.png", alt: "Dream Spirits label template", class: "w-full rounded-lg border border-white/10 block" }),
        logoNode
          ? el(
              "div",
              {
                class: "absolute flex items-center justify-center overflow-hidden bg-white",
                style: "left:81.47%;top:26.49%;width:30.44%;height:16.63%;padding:1.2%;transform:translate(-50%,-50%) rotate(-0.73deg);",
              },
              logoNode
            )
          : null,
      ]),
    ]),
  ]);
}

function reviewRow(label, value) {
  return el("div", {}, [
    el("div", { class: "text-[10px] font-semibold text-gold/70 uppercase tracking-[0.2em] mb-1" }, label),
    el("div", { class: "text-sm text-ivory/70" }, value),
  ]);
}

function barrelList(ids) {
  return el(
    "ul",
    { class: "space-y-1" },
    (ids || []).map((id) => {
      const b = getBarrel(id);
      return el("li", { class: "text-sm text-ivory/70" }, b ? b.sku : "Barrel unavailable");
    })
  );
}

// Read-only look at a step other than the pick's current one. Deliberately
// has no buttons that change the pick — the interactive controls only ever
// appear on the current step (see actionPanel).
function phaseReviewPanel(pick, n) {
  const title = PHASES.find((p) => p.n === n).label;
  const message = (text) => card([el("div", { class: "p-6" }, panelHeading(title, text))]);
  const detail = (subtitle, rows) => card([el("div", { class: "p-6 space-y-5" }, [...panelHeading(title, subtitle), ...rows.filter(Boolean)])]);

  if (n === 3 && pick.pickMethod === "2B_in_person") return message("Sample fulfillment doesn't apply to in-person visits.");
  if (n > pick.phase) return message("This step hasn't started yet.");

  if (n === 1) {
    return detail("Request received.", [
      reviewRow("Received", fmtDate(pick.createdAt)),
      reviewRow("Contact", `${pick.contact.name} · ${pick.contact.email}`),
    ]);
  }
  if (n === 2) {
    return pick.pickMethod === "2B_in_person"
      ? detail("In-person visit.", [
          reviewRow("Requested dates", el("div", { class: "flex flex-wrap gap-2" }, (pick.requestedDates || []).map((d) => badge(fmtStayWindow(d), "neutral")))),
          reviewRow("Confirmed visit", pick.approvedDate ? fmtStayWindow(pick.approvedDate) : "Waiting on staff to confirm a date"),
          pick.houseRulesAcknowledged ? reviewRow("Minimum-barrel policy", "✓ Acknowledged") : null,
        ])
      : detail("Samples shipped by mail.", [
          pick.shippingAddress
            ? reviewRow("Shipping address", `${pick.shippingAddress.street}, ${pick.shippingAddress.city}, ${pick.shippingAddress.state} ${pick.shippingAddress.zip}`)
            : null,
          reviewRow(`Samples requested (${(pick.sampleBarrelIds || []).length})`, barrelList(pick.sampleBarrelIds)),
        ]);
  }
  if (n === 3) {
    const finalLabel = pick.finalSampleStatus === "approved" ? "Approved" : pick.finalSampleStatus === "submitted" ? "Submitted — waiting on approval" : "Not submitted yet";
    return detail("Samples shipped and a final selection made.", [
      reviewRow("Tracking", pick.sampleTracking || "Not entered yet"),
      reviewRow(`Samples requested (${(pick.sampleBarrelIds || []).length})`, barrelList(pick.sampleBarrelIds)),
      reviewRow("Final selection", finalLabel),
      pick.finalSampleBarrelIds && pick.finalSampleBarrelIds.length ? barrelList(pick.finalSampleBarrelIds) : null,
    ]);
  }
  if (n === 4) {
    return pick.logo
      ? labelPreviewCard(pick.logo, title, `Logo on file: ${pick.logo.fileName}`)
      : message("No logo has been uploaded.");
  }
  if (n === 5) {
    const b = pick.bottling || {};
    const statusLabel = b.status === "complete" ? "Complete" : b.status === "in_progress" ? "In progress" : "Not started";
    return detail("Bottling progress.", [
      reviewRow("Status", statusLabel),
      reviewRow("Bottle count", b.bottleCount != null ? String(b.bottleCount) : "Not entered"),
      b.notes ? reviewRow("Notes", b.notes) : null,
      b.updatedAt ? reviewRow("Last updated", fmtDate(b.updatedAt)) : null,
    ]);
  }
  return message("Payment is settled and the public listing is complete.");
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

  if (pick.pickMethod === "2B_in_person" && pick.dateStatus === "approved" && pick.phase === 4 && !pick.logo) {
    panels.push(
      card([
        el("div", { class: "p-6 flex items-center gap-3" }, [
          badge("Date Confirmed", "green"),
          el("span", { class: "text-sm text-ivory/60" }, `Visit confirmed: ${fmtStayWindow(pick.approvedDate)}.`),
        ]),
      ])
    );
  }

  // Phase 3: sample fulfillment — staff ships samples & enters tracking,
  // customer confirms which of the shipped samples they've chosen.
  if (pick.pickMethod === "2A_ship_samples" && pick.phase === 3) {
    if (role === "staff") {
      let trackingVal = pick.sampleTracking || "";
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            ...panelHeading("Shipment Tracking", "Enter the tracking number once the sample shipment goes out."),
            field("Tracking Number", textInput({ type: "text", value: trackingVal, oninput: (e) => (trackingVal = e.target.value) })),
            el("div", { class: "pt-4" }, [
              button("Save Tracking Number", {
                variant: "secondary",
                onClick: () => {
                  setSampleTracking(pick.id, trackingVal.trim());
                  refresh();
                },
              }),
            ]),
          ]),
        ])
      );

      if (pick.finalSampleStatus === "approved") {
        panels.push(
          card([
            el("div", { class: "p-6" }, [
              ...panelHeading("Sample Selection Approved", "Once label creation is ready to begin, advance this pick."),
              el(
                "ul",
                { class: "space-y-1 mb-4" },
                pick.finalSampleBarrelIds.map((id) => {
                  const b = getBarrel(id);
                  return el("li", { class: "text-sm text-ivory/70" }, b ? b.sku : "Barrel unavailable");
                })
              ),
              button("Advance to Label Creation", {
                variant: "gold",
                onClick: () => {
                  advanceToLabelCreation(pick.id);
                  refresh();
                },
              }),
            ]),
          ])
        );
      } else if (pick.finalSampleStatus === "submitted") {
        panels.push(
          card([
            el("div", { class: "p-6" }, [
              ...panelHeading("Approve Sample Selection", "The customer has confirmed which samples they've chosen."),
              el(
                "ul",
                { class: "space-y-1 mb-4" },
                pick.finalSampleBarrelIds.map((id) => {
                  const b = getBarrel(id);
                  return el("li", { class: "text-sm text-ivory/70" }, b ? b.sku : "Barrel unavailable");
                })
              ),
              button("Approve Selection", {
                variant: "gold",
                onClick: () => {
                  approveFinalSampleSelections(pick.id);
                  refresh();
                },
              }),
            ]),
          ])
        );
      } else {
        panels.push(card([el("div", { class: "p-6" }, panelHeading("Waiting on Sample Selection", "Customer has not confirmed their sample selection yet."))]));
      }
    } else {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            ...panelHeading(
              "Sample Shipment",
              pick.sampleTracking ? "Your samples are on the way." : "Dream Spirits is preparing your sample shipment."
            ),
            pick.sampleTracking
              ? el("div", { class: "text-sm text-ivory/70" }, [el("span", { class: "text-ivory/40" }, "Tracking: "), pick.sampleTracking])
              : el("div", { class: "text-sm text-ivory/40" }, "Tracking info will appear here once it ships."),
          ]),
        ])
      );

      if (pick.finalSampleStatus === "approved") {
        panels.push(
          card([
            el("div", { class: "p-6" }, [
              ...panelHeading(
                "Selection Approved",
                pick.sampleTracking
                  ? "You're ready to move forward. Your confirmed samples:"
                  : "Dream Spirits will begin label creation shortly. Your confirmed samples:"
              ),
              el(
                "ul",
                { class: "space-y-1 mb-4" },
                pick.finalSampleBarrelIds.map((id) => {
                  const b = getBarrel(id);
                  return el("li", { class: "text-sm text-ivory/60" }, b ? b.sku : "Barrel unavailable");
                })
              ),
              pick.sampleTracking
                ? button("Move to Label Creation", {
                    variant: "gold",
                    onClick: () => {
                      advanceToLabelCreation(pick.id);
                      refresh();
                    },
                  })
                : null,
            ]),
          ])
        );
      } else if (pick.finalSampleStatus === "submitted") {
        panels.push(
          card([
            el("div", { class: "p-6" }, [
              ...panelHeading("Waiting on approval", "Dream Spirits is reviewing your sample selection:"),
              el(
                "ul",
                { class: "space-y-1" },
                pick.finalSampleBarrelIds.map((id) => {
                  const b = getBarrel(id);
                  return el("li", { class: "text-sm text-ivory/60" }, b ? b.sku : "Barrel unavailable");
                })
              ),
            ]),
          ])
        );
      } else {
        const shippedBarrels = getState().barrels.filter((b) => pick.sampleBarrelIds.includes(b.id));
        const finalSelected = new Set(pick.sampleBarrelIds);
        const selectionError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mt-4" }, "Please select at least one sample to move forward with.");
        panels.push(
          card([
            el("div", { class: "p-6" }, [
              ...panelHeading("Confirm Your Selection", "Which of your shipped samples would you like to move forward with? Choose up to 5."),
              renderSampleSelector({ barrels: shippedBarrels, selected: finalSelected, lockedId: pick.barrelId }),
              selectionError,
              el("div", { class: "pt-4" }, [
                button("Submit Selection", {
                  variant: "gold",
                  onClick: () => {
                    if (finalSelected.size === 0) {
                      selectionError.classList.remove("hidden");
                      return;
                    }
                    submitFinalSampleSelections(pick.id, Array.from(finalSelected));
                    refresh();
                  },
                }),
              ]),
            ]),
          ])
        );
      }
    }
  }

  // Phase 4: label creation — customer uploads logo
  if (pick.phase === 4 || (pick.phase >= 5 && pick.logo)) {
    if (!pick.logo && role === "customer") {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            ...panelHeading("Upload Your Logo", "Upload a logo (PNG, JPG, SVG, or PDF) for your custom label."),
            logoFileInput(pick, refresh),
          ]),
        ])
      );
      panels.push(labelPreviewCard(null, "Label Template", "Your logo will appear in the blank box marked “Dreamt Up Exclusively For.”"));
    } else if (!pick.logo && role === "staff") {
      panels.push(card([el("div", { class: "p-6" }, panelHeading("Waiting on Logo", "Customer has not uploaded a logo yet."))]));
    } else if (pick.logo) {
      panels.push(
        card([
          el("div", { class: "p-6" }, [
            el("h3", { class: "font-serif text-xl text-ivory mb-3" }, "Label Logo"),
            pick.logo.fileType === "application/pdf"
              ? el(
                  "a",
                  {
                    href: pick.logo.dataUrl,
                    target: "_blank",
                    class: "flex items-center gap-3 max-w-xs rounded-lg border border-white/10 mb-2 bg-white/5 p-4 hover:border-gold/40 transition-colors",
                  },
                  [
                    el("span", { class: "text-2xl" }, "📄"),
                    el("span", { class: "text-sm text-gold-light underline underline-offset-2" }, "View PDF"),
                  ]
                )
              : el("img", { src: pick.logo.dataUrl, class: "max-h-32 rounded-lg border border-white/10 mb-2 bg-white/5 p-2" }),
            el("div", { class: "text-xs text-ivory/35 mb-4" }, pick.logo.fileName),
            // The label hasn't gone to fulfillment yet, so the customer can still swap the logo.
            role === "customer" && pick.phase <= 5
              ? el("div", { class: "pt-4 mt-1 border-t border-white/10" }, [
                  el("div", { class: "text-sm text-ivory/60 mb-2" }, "Want to use a different logo?"),
                  logoFileInput(pick, refresh),
                ])
              : null,
            pick.phase === 4 && role === "staff"
              ? button("Advance to Bottling", {
                  variant: "gold",
                  onClick: () => {
                    advanceToBottling(pick.id);
                    refresh();
                  },
                })
              : null,
          ]),
        ])
      );
      panels.push(labelPreviewCard(pick.logo, "Label Preview", "Your logo placed on the label in the “Dreamt Up Exclusively For” box."));
    }
  }

  // Phase 5: bottling — staff updates status
  if (pick.phase === 5) {
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

  // Phase 6: payment & fulfillment — staff marks listing complete
  if (pick.phase === 6) {
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

  if (pick.phase === 7) {
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
  // Which step the tracker is showing; null means the pick's real current
  // step. Local only — viewing never touches the stored pick.
  let viewedPhase = null;

  function refresh() {
    const pick = getPick(id);
    const state = getState();
    const isForeignPick = pick && state.currentRole === "customer" && pick.contact.email.toLowerCase() !== (state.currentCustomerEmail || "").toLowerCase();
    if (!pick || isForeignPick) {
      wrap.replaceChildren(el("p", { class: "text-ivory/40" }, "Pick not found."));
      return;
    }
    const barrel = getBarrel(pick.barrelId);
    const viewing = viewedPhase != null && viewedPhase !== pick.phase ? viewedPhase : null;
    const canGoBack = pick.phase > minPickPhase(pick) && viewing == null;
    const currentLabel = PHASES.find((p) => p.n === pick.phase).label;
    wrap.replaceChildren(
      ...[
        el("a", { href: state.currentRole === "staff" ? "#/dashboard" : "#/my-picks", class: "text-xs text-gold/70 hover:text-gold transition-colors" }, "← Back"),
        el("h1", { class: "font-serif text-4xl text-ivory mt-3 mb-1" }, `Pick ${pick.id.slice(-6).toUpperCase()}`),
        el("p", { class: "text-sm text-ivory/35 mb-8" }, `Created ${fmtDate(pick.createdAt)}`),
        phaseTracker(pick.phase, viewing, (n) => {
          viewedPhase = n === pick.phase ? null : n;
          refresh();
        }),
        canGoBack
          ? el(
              "div",
              { class: "flex justify-end -mt-6 mb-6" },
              button("← Back to previous step", {
                variant: "ghost",
                extraClass: "text-xs",
                onClick: () => {
                  goToPreviousPhase(pick.id);
                  refresh();
                },
              })
            )
          : null,
        el("div", { class: "grid grid-cols-3 gap-6" }, [
          el(
            "div",
            { class: "col-span-2" },
            viewing == null
              ? actionPanel(pick, barrel, state.currentRole, refresh)
              : [
                  el("div", { class: "flex items-center justify-between gap-3 flex-wrap text-sm bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-3 mb-4" }, [
                    el("span", { class: "text-ivory/70" }, `Viewing “${PHASES.find((p) => p.n === viewing).label}”. This pick is currently on “${currentLabel}”.`),
                    button("Return to current step", {
                      variant: "ghost",
                      extraClass: "text-xs",
                      onClick: () => {
                        viewedPhase = null;
                        refresh();
                      },
                    }),
                  ]),
                  phaseReviewPanel(pick, viewing),
                ]
          ),
          el("div", { class: "col-span-1" }, summaryCard(pick, barrel)),
        ]),
      ].filter(Boolean)
    );
  }

  refresh();
  return wrap;
}
