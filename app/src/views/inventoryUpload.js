import { bulkAddBarrels } from "../store.js";
import { el, card, button } from "../ui.js";
import { navigate } from "../router.js";

const HEADER = ["whiskeyType", "ageYears", "distiller", "warehouser", "mashBill", "numBarrels", "pricePerBarrel", "samplesAvailable"];

const SAMPLE_CSV = `whiskeyType,ageYears,distiller,warehouser,mashBill,numBarrels,pricePerBarrel,samplesAvailable
Bourbon Whiskey,9.2,MGPI of Indiana,MGPI - Lawrenceburg,60/36/4,20,2450,true
Rye Whiskey,8.5,MGPI of Indiana,Eight Settlers,0/95/5,15,2100,true`;

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ["File is empty."] };

  const header = lines[0].split(",").map((h) => h.trim());
  const missing = HEADER.filter((h) => !header.includes(h));
  if (missing.length) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const rows = [];
  const errors = [];
  lines.slice(1).forEach((line, idx) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    header.forEach((h, i) => (row[h] = cells[i]));
    const rowNum = idx + 2;

    const ageYears = Number(row.ageYears);
    const numBarrels = Number(row.numBarrels);
    const pricePerBarrel = Number(row.pricePerBarrel);
    if (!row.whiskeyType || !row.distiller || !row.warehouser || !row.mashBill) {
      errors.push(`Row ${rowNum}: missing a required text field.`);
      return;
    }
    if (isNaN(ageYears) || isNaN(numBarrels) || isNaN(pricePerBarrel)) {
      errors.push(`Row ${rowNum}: ageYears, numBarrels, and pricePerBarrel must be numbers.`);
      return;
    }
    rows.push({
      whiskeyType: row.whiskeyType,
      ageYears,
      distiller: row.distiller,
      warehouser: row.warehouser,
      mashBill: row.mashBill,
      numBarrels,
      pricePerBarrel,
      samplesAvailable: String(row.samplesAvailable).toLowerCase() === "true",
    });
  });

  return { rows, errors };
}

export function renderInventoryUpload() {
  let csvText = "";
  let preview = { rows: [], errors: [] };

  const wrap = el("div", { class: "px-8 py-16 max-w-3xl mx-auto" });

  function draw() {
    const textarea = el("textarea", {
      class:
        "w-full h-48 rounded-lg bg-white/[0.04] border border-white/15 px-3.5 py-3 text-xs font-mono text-ivory placeholder:text-ivory/25 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:border-gold/50",
      placeholder: SAMPLE_CSV,
      value: csvText,
      oninput: (e) => {
        csvText = e.target.value;
      },
    });

    const fileInput = el("input", {
      type: "file",
      accept: ".csv,text/csv",
      class:
        "text-sm text-ivory/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold/15 file:text-gold-light file:text-xs file:font-medium hover:file:bg-gold/25 file:cursor-pointer cursor-pointer",
      onchange: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          csvText = String(reader.result);
          preview = parseCsv(csvText);
          draw();
        };
        reader.readAsText(file);
      },
    });

    const previewCard =
      preview.rows.length || preview.errors.length
        ? card(
            [
              el("div", { class: "p-5" }, [
                preview.errors.length
                  ? el(
                      "div",
                      { class: "text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-lg px-4 py-2.5 mb-3" },
                      preview.errors.map((e) => el("div", {}, e))
                    )
                  : null,
                preview.rows.length
                  ? el("div", { class: "text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-400/25 rounded-lg px-4 py-2.5" }, `${preview.rows.length} barrel(s) ready to import.`)
                  : null,
              ]),
            ],
            "mt-4"
          )
        : null;

    const form = card(
      [
        el("div", { class: "p-8 space-y-5" }, [
          el("div", {}, [
            el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Upload a CSV file"),
            fileInput,
          ]),
          el("div", { class: "text-xs text-ivory/30" }, "— or paste CSV below —"),
          el("div", {}, [
            el(
              "span",
              { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" },
              "CSV data (columns: whiskeyType, ageYears, distiller, warehouser, mashBill, numBarrels, pricePerBarrel, samplesAvailable)"
            ),
            textarea,
          ]),
          el("div", { class: "flex gap-3" }, [
            button("Preview", {
              variant: "secondary",
              onClick: () => {
                preview = parseCsv(csvText);
                draw();
              },
            }),
            button("Import Barrels", {
              variant: "gold",
              disabled: !preview.rows.length,
              onClick: () => {
                bulkAddBarrels(preview.rows);
                navigate("/");
              },
            }),
            button("Cancel", { variant: "ghost", onClick: () => navigate("/") }),
          ]),
        ]),
      ],
      ""
    );

    wrap.replaceChildren(
      el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "Upload Inventory"),
      el("p", { class: "text-sm text-ivory/40 mb-8" }, "Bulk-add barrels from a CSV export of your inventory."),
      // Node.replaceChildren() stringifies a null arg to the literal text
      // "null" (unlike our el() helper) — previewCard is null until the
      // first Preview click, so it must be filtered out, not passed as-is.
      ...[form, previewCard].filter(Boolean)
    );
  }

  draw();
  return wrap;
}
