import { el, fmtMoney } from "../ui.js";

const MAX_SAMPLES = 5;

// Searchable, checkbox-selectable table of available barrels for a sample
// shipment. `selected` is a Set of barrel ids, mutated in place. `lockedId`
// (the barrel the customer started this pick from) stays checked and can't
// be unchecked. `onChange` fires after every toggle so the caller can update
// anything outside this component (e.g. re-validate the wizard).
export function renderSampleSelector({ barrels, selected, lockedId, onChange }) {
  let query = "";
  const resultsWrap = el("div", {});
  const countLabel = el("span", { class: "text-xs text-ivory/40" });

  function updateCount() {
    countLabel.textContent = `${selected.size} of ${MAX_SAMPLES} selected`;
  }

  function renderRows() {
    const list = barrels.filter((b) => {
      // A barrel that's gone Not Available (e.g. its sample quantity was
      // just claimed by someone else) shouldn't offer new selections — but
      // if it's already checked here, keep showing it so this pick can
      // still see/uncheck what it already has.
      if (b.status !== "available" && b.id !== lockedId && !selected.has(b.id)) return false;
      if (!query) return true;
      return `${b.sku} ${b.distilledWhen}`.toLowerCase().includes(query.toLowerCase());
    });

    const atCap = selected.size >= MAX_SAMPLES;

    const rows = list.map((b) => {
      const isChecked = selected.has(b.id);
      const isLocked = b.id === lockedId;
      const isDisabled = isLocked || (atCap && !isChecked);
      return el("tr", { class: "border-b border-white/5 hover:bg-white/[0.03]" }, [
        el(
          "td",
          { class: "px-3 py-2 w-8" },
          el("input", {
            type: "checkbox",
            checked: isChecked,
            disabled: isDisabled,
            class: "w-5 h-5 sm:w-4 sm:h-4 accent-gold-light",
            onchange: (e) => {
              if (e.target.checked) selected.add(b.id);
              else selected.delete(b.id);
              updateCount();
              renderRows();
              onChange?.();
            },
          })
        ),
        el("td", { class: "px-3 py-2 text-sm text-ivory" }, [
          b.sku,
          isLocked ? el("span", { class: "ml-2 text-[10px] text-gold/70 uppercase tracking-wide align-middle" }, "Your Pick") : null,
          // Phones don't have room for separate columns, so the details sit under the name.
          el("div", { class: "sm:hidden text-xs text-ivory/45 mt-0.5" }, `${b.distilledWhen || "—"} · ${fmtMoney(b.privateGroupPricing)} /bottle`),
        ]),
        el("td", { class: "hidden sm:table-cell px-3 py-2 text-xs text-ivory/45 whitespace-nowrap" }, b.distilledWhen || "—"),
        el("td", { class: "hidden sm:table-cell px-3 py-2 text-xs text-gold-light whitespace-nowrap" }, `${fmtMoney(b.privateGroupPricing)} /bottle`),
      ]);
    });

    resultsWrap.replaceChildren(
      el("table", { class: "w-full text-sm" }, [
        el(
          "thead",
          {},
          el("tr", { class: "border-b border-white/10 text-left text-[10px] font-semibold text-ivory/35 uppercase tracking-[0.15em]" }, [
            el("th", { class: "px-3 py-2 w-8" }, ""),
            el("th", { class: "px-3 py-2" }, "SKU"),
            el("th", { class: "hidden sm:table-cell px-3 py-2" }, "Distilled"),
            el("th", { class: "hidden sm:table-cell px-3 py-2" }, "Private Group"),
          ])
        ),
        el(
          "tbody",
          {},
          rows.length ? rows : el("tr", {}, el("td", { class: "px-3 py-6 text-center text-ivory/30", colSpan: 4 }, "No barrels match your search."))
        ),
      ])
    );
  }

  const searchInput = el("input", {
    type: "search",
    placeholder: "Search by SKU...",
    class:
      "flex-1 rounded-lg bg-white/[0.04] border border-white/15 px-3.5 py-2 text-sm text-ivory placeholder:text-ivory/30 focus:outline-none focus:ring-1 focus:ring-gold/50",
    oninput: (e) => {
      query = e.target.value;
      renderRows();
    },
  });

  renderRows();
  updateCount();

  return el("div", { class: "select-none" }, [
    el("div", { class: "flex items-center gap-3 mb-3" }, [searchInput, countLabel]),
    el("div", { class: "max-h-64 overflow-auto rounded-lg border border-white/10" }, resultsWrap),
  ]);
}
