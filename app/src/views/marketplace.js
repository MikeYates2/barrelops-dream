import { getState, requestMembership } from "../store.js";
import { el, badge, button, fmtMoney, card, sectionHeading, textInput } from "../ui.js";
import { navigate } from "../router.js";

const STATUS_TONE = {
  available: ["Available", "green"],
  in_bottling: ["In Bottling", "amber"],
  not_available: ["Not Available", "red"],
  sold: ["Reserved", "neutral"],
};

const TYPE_GRADIENT = {
  "Bourbon Whiskey": "from-amber-700/50 via-amber-950/40 to-noir",
  "Rye Whiskey": "from-orange-800/50 via-red-950/35 to-noir",
  "Single Malt Whiskey": "from-yellow-700/40 via-stone-900/50 to-noir",
  "Wheated Whiskey": "from-yellow-600/40 via-amber-950/40 to-noir",
};

function typeGradient(type) {
  return TYPE_GRADIENT[type] || "from-stone-700/40 via-stone-950/40 to-noir";
}

// In-page smooth scroll. Deliberately not an <a href="#id"> — our router
// treats the URL hash as a route path, so setting it to a bare section id
// (no leading slash) would fall through to the 404 route.
function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function heroSection() {
  return el(
    "section",
    { class: "relative min-h-[78vh] flex flex-col items-center justify-center text-center px-8 overflow-hidden" },
    [
      el("div", { class: "reveal flex flex-col items-center gap-6 max-w-3xl" }, [
        el("span", { class: "text-xs font-semibold tracking-[0.35em] text-gold uppercase" }, "Single Barrel · By Invitation"),
        el(
          "h1",
          { class: "font-serif text-6xl md:text-7xl leading-[1.05] text-ivory" },
          ["Exceptional Barrels.", el("br"), el("span", { class: "italic text-gold-light" }, "Uncommon"), " Character."]
        ),
        el(
          "p",
          { class: "text-ivory/50 text-lg max-w-xl leading-relaxed" },
          "Each barrel in our collection is hand-selected, singularly tracked, and released to a small circle of private groups and retailers who understand what makes it worth waiting for."
        ),
        el("div", { class: "flex items-center gap-4 mt-2" }, [
          button("Explore the Collection", {
            variant: "gold",
            onClick: () => scrollToId("collection"),
          }),
          button("Request Membership", {
            variant: "secondary",
            onClick: () => scrollToId("membership"),
          }),
        ]),
      ]),
      el("div", { class: "absolute bottom-8 left-1/2 -translate-x-1/2 text-gold/40 text-2xl animate-bounce" }, "⌄"),
    ]
  );
}

function barrelCard(b, role) {
  const [statusLabel, statusTone] = STATUS_TONE[b.status] || STATUS_TONE.available;
  return card([
    el("div", { class: `h-44 flex flex-col items-center justify-center relative bg-gradient-to-br ${typeGradient(b.whiskeyType)} border-b border-white/10` }, [
      el("span", { class: "text-[10px] tracking-[0.3em] text-gold/70 uppercase mb-2" }, b.distiller),
      el("span", { class: "font-serif text-3xl text-ivory tracking-wide text-center px-4" }, b.whiskeyType),
      el("span", { class: "text-xs text-ivory/50 tracking-widest uppercase mt-2" }, `${b.ageYears} Years`),
      el("div", { class: "absolute top-3 right-3" }, badge(b.samplesAvailable ? "Samples Ready" : "No Samples", b.samplesAvailable ? "gold" : "neutral")),
    ]),
    el("div", { class: "p-5 flex flex-col gap-3" }, [
      el("div", { class: "text-xs text-ivory/40 tracking-wide" }, b.warehouser),
      el("div", { class: "flex items-center justify-between text-xs text-ivory/50" }, [
        el("span", {}, `Mash Bill ${b.mashBill}`),
        el("span", {}, `${b.numBarrels} barrels`),
      ]),
      el("div", { class: "h-px bg-white/10 my-1" }),
      el("div", { class: "flex items-center justify-between" }, [
        el("span", { class: "font-serif text-2xl text-gold-light" }, fmtMoney(b.pricePerBarrel)),
        badge(statusLabel, statusTone),
      ]),
      role === "customer" && b.status === "available"
        ? button("Reserve This Barrel", { variant: "gold", extraClass: "w-full mt-1", onClick: () => navigate(`/pick/new/${b.id}`) })
        : role === "staff"
        ? el("div", { class: "text-[11px] text-ivory/30 tracking-wide mt-1" }, `Listed ${new Date(b.dateAdded).toLocaleDateString()}`)
        : null,
    ]),
  ]);
}

function darkTable(barrels) {
  const cols = ["Whiskey Type", "Age", "Distiller", "Warehouser", "Mash Bill", "# Barrels", "Price", "Status", "Samples"];
  return card(
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
            barrels.map((b) => {
              const [statusLabel, statusTone] = STATUS_TONE[b.status] || STATUS_TONE.available;
              return el("tr", { class: "border-b border-white/5 hover:bg-white/[0.03]" }, [
                el("td", { class: "px-4 py-3 font-medium text-ivory whitespace-nowrap" }, b.whiskeyType),
                el("td", { class: "px-4 py-3 text-ivory/60" }, String(b.ageYears)),
                el("td", { class: "px-4 py-3 text-ivory/60 whitespace-nowrap" }, b.distiller),
                el("td", { class: "px-4 py-3 text-ivory/60 whitespace-nowrap" }, b.warehouser),
                el("td", { class: "px-4 py-3 text-ivory/60 whitespace-nowrap" }, b.mashBill),
                el("td", { class: "px-4 py-3 text-ivory/60" }, String(b.numBarrels)),
                el("td", { class: "px-4 py-3 text-gold-light font-medium whitespace-nowrap" }, fmtMoney(b.pricePerBarrel)),
                el("td", { class: "px-4 py-3" }, badge(statusLabel, statusTone)),
                el("td", { class: "px-4 py-3" }, badge(b.samplesAvailable ? "Available" : "Not Avail.", b.samplesAvailable ? "green" : "red")),
              ]);
            })
          ),
        ]),
      ]),
    ],
    "",
    { glare: false }
  );
}

function valuesSection() {
  const values = [
    { glyph: "◈", title: "Provenance", copy: "Every barrel is traced to its distillery, warehouse, and rickhouse position — no anonymous bulk lots." },
    { glyph: "✦", title: "Craftsmanship", copy: "Hand-selected for singular character. What you taste in the sample is exactly what ships in the bottle." },
    { glyph: "◆", title: "Exclusivity", copy: "Never mass-produced. Each barrel is released to one private group or retailer, once, and then it's gone." },
  ];
  return el("section", { class: "max-w-6xl mx-auto px-8 py-28" }, [
    sectionHeading({
      eyebrow: "What We Stand For",
      title: "The values behind every pick.",
      subtitle: "This isn't an inventory system for commodity spirits — it's how we keep a promise to people who care about what's in the glass.",
    }),
    el(
      "div",
      { class: "grid md:grid-cols-3 gap-6" },
      values.map((v) =>
        card(
          [
            el("div", { class: "p-8 flex flex-col gap-4" }, [
              el("span", { class: "text-gold text-3xl" }, v.glyph),
              el("h3", { class: "font-serif text-2xl text-ivory" }, v.title),
              el("p", { class: "text-ivory/50 text-sm leading-relaxed" }, v.copy),
            ]),
          ],
          "",
          { reveal: true }
        )
      )
    ),
  ]);
}

function membershipSection() {
  let submitted = false;
  const dynamicSlot = el("div", { class: "mt-2 w-full flex justify-center" });

  function drawDynamicSlot() {
    const name = { value: "" };
    const email = { value: "" };

    dynamicSlot.replaceChildren(
      submitted
        ? el("div", { class: "flex items-center gap-2 text-gold-light" }, [
            el("span", {}, "✦"),
            el("span", { class: "text-sm tracking-wide" }, "Request received — we'll be in touch personally."),
          ])
        : el(
            "form",
            {
              class: "flex flex-col sm:flex-row gap-3 w-full max-w-md",
              onsubmit: (e) => {
                e.preventDefault();
                if (!name.value.trim() || !email.value.trim()) return;
                requestMembership({ name: name.value.trim(), email: email.value.trim() });
                submitted = true;
                drawDynamicSlot();
              },
            },
            [
              textInput({
                type: "text",
                placeholder: "Your name",
                class:
                  "flex-1 rounded-full bg-white/[0.05] border border-white/15 px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50",
                oninput: (e) => (name.value = e.target.value),
              }),
              textInput({
                type: "email",
                placeholder: "Email address",
                class:
                  "flex-1 rounded-full bg-white/[0.05] border border-white/15 px-4 py-2.5 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50",
                oninput: (e) => (email.value = e.target.value),
              }),
              button("Request Invitation", { variant: "gold", type: "submit", extraClass: "shrink-0" }),
            ]
          )
    );
  }
  drawDynamicSlot();

  // The glass panel (and its reveal-on-scroll) is built exactly once — only
  // dynamicSlot's contents swap between the form and the confirmation state,
  // so the panel never has to be re-observed by the scroll-reveal watcher.
  const panel = card(
    [
      el("div", { class: "p-10 md:p-14 flex flex-col items-center text-center gap-6" }, [
        el("span", { class: "text-xs font-semibold tracking-[0.35em] text-gold uppercase" }, "The Dream Spirits Circle"),
        el("h2", { class: "font-serif text-4xl md:text-5xl text-ivory leading-tight" }, "Membership is by invitation."),
        el(
          "p",
          { class: "text-ivory/50 max-w-lg leading-relaxed" },
          "Circle members receive first access to new barrels before they're listed, private tasting invitations, and a dedicated concierge for every pick. We keep the list small on purpose."
        ),
        dynamicSlot,
      ]),
    ],
    "",
    { strong: true, reveal: true }
  );

  return el("section", { class: "max-w-4xl mx-auto px-8 pb-28", id: "membership" }, [panel]);
}

export function renderMarketplace() {
  const state = getState();
  let query = "";
  let viewMode = "grid"; // staff can toggle to 'table'

  // Only the results grid/table and the count footnote are rebuilt when the
  // search query or view mode change. The search input, toggle buttons, and
  // headings are built once and mutated in place — recreating the <input>
  // node on every keystroke (the original approach) drops focus after each
  // character typed.
  const resultsWrap = el("div", {});
  const footNote = el("div", { class: "text-center text-xs text-ivory/25 mt-8 tracking-wide" });

  function renderResults() {
    const barrels = state.barrels.filter((b) => {
      if (!query) return true;
      const hay = `${b.whiskeyType} ${b.distiller} ${b.warehouser} ${b.mashBill}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    });

    const results =
      viewMode === "table" && state.currentRole === "staff"
        ? darkTable(barrels)
        : barrels.length
        ? el(
            "div",
            { class: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" },
            barrels.map((b) => barrelCard(b, state.currentRole))
          )
        : el("div", { class: "text-center text-ivory/30 py-20" }, "No barrels match your search.");

    resultsWrap.replaceChildren(results);
    footNote.textContent = `Showing ${barrels.length} of ${state.barrels.length} barrels`;
  }

  const headerRow = el("div", { class: "flex flex-wrap items-end justify-between gap-6 mb-10" }, [
    sectionHeading({
      eyebrow: "The Collection",
      title: "Currently available.",
      subtitle: null,
      align: "left",
    }),
    state.currentRole === "staff"
      ? el("div", { class: "flex gap-2 mb-14" }, [
          button("Upload Inventory", { variant: "secondary", onClick: () => navigate("/inventory/upload") }),
          button("+ Add Barrel", { variant: "gold", onClick: () => navigate("/inventory/new") }),
        ])
      : null,
  ]);

  const searchInput = el("input", {
    type: "search",
    placeholder: "Search listings, distillers, warehousers, mash bills...",
    class:
      "w-full rounded-full glass border border-white/15 px-5 py-3 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50",
    oninput: (e) => {
      query = e.target.value;
      renderResults();
    },
  });

  let gridBtn = null;
  let tableBtn = null;
  function syncToggleStyles() {
    const active = "bg-gold text-noir font-semibold";
    const inactive = "text-ivory/50";
    gridBtn.className = `px-4 py-1.5 rounded-full text-xs tracking-wide transition-colors ${viewMode === "grid" ? active : inactive}`;
    tableBtn.className = `px-4 py-1.5 rounded-full text-xs tracking-wide transition-colors ${viewMode === "table" ? active : inactive}`;
  }

  const controlsChildren = [el("div", { class: "relative flex-1 min-w-[240px]" }, searchInput)];
  if (state.currentRole === "staff") {
    gridBtn = el("button", {
      textContent: "Showcase",
      onclick: () => {
        viewMode = "grid";
        syncToggleStyles();
        renderResults();
      },
    });
    tableBtn = el("button", {
      textContent: "Table",
      onclick: () => {
        viewMode = "table";
        syncToggleStyles();
        renderResults();
      },
    });
    controlsChildren.push(el("div", { class: "flex gap-1 p-1 rounded-full glass border border-white/10" }, [gridBtn, tableBtn]));
    syncToggleStyles();
  }

  const controls = el("div", { class: "flex flex-wrap items-center gap-3 mb-8" }, controlsChildren);

  renderResults();

  const collectionSection = el("section", { class: "max-w-6xl mx-auto px-8 py-24", id: "collection" }, [
    headerRow,
    controls,
    resultsWrap,
    footNote,
  ]);

  const wrap = el("div", {}, [heroSection(), collectionSection, valuesSection(), membershipSection()]);
  return wrap;
}
