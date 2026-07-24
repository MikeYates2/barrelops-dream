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

  const wrap = el("div", { class: "p-8 max-w-3xl mx-auto" });

  function draw() {
    const textarea = el("textarea", {
      class: "w-full h-48 rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-600/40",
      placeholder: SAMPLE_CSV,
      value: csvText,
      oninput: (e) => {
        csvText = e.target.value;
      },
    });

    const fileInput = el("input", {
      type: "file",
      accept: ".csv,text/csv",
      class: "text-sm",
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
              el("div", { class: "p-4" }, [
                preview.errors.length
                  ? el(
                      "div",
                      { class: "text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3" },
                      preview.errors.map((e) => el("div", {}, e))
                    )
                  : null,
                preview.rows.length
                  ? el("div", { class: "text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2" }, `${preview.rows.length} barrel(s) ready to import.`)
                  : null,
              ]),
            ],
            "mt-4"
          )
        : null;

    const form = card(
      [
        el("div", { class: "p-6 space-y-4" }, [
          el("div", {}, [
            el("span", { class: "block text-sm font-medium text-stone-700 mb-1" }, "Upload a CSV file"),
            fileInput,
          ]),
          el("div", { class: "text-xs text-stone-400" }, "— or paste CSV below —"),
          el("div", {}, [
            el(
              "span",
              { class: "block text-sm font-medium text-stone-700 mb-1" },
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
      el("h1", { class: "text-2xl font-bold text-stone-900 mb-1" }, "Upload Inventory"),
      el("p", { class: "text-sm text-stone-500 mb-6" }, "Bulk-add barrels from a CSV export of your inventory."),
      form,
      previewCard
    );
  }

  draw();
  return wrap;
}
