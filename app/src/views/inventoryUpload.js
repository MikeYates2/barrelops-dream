import { bulkAddBarrels } from "../store.js";
import { el, card, button } from "../ui.js";
import { navigate } from "../router.js";

// Excel/PDF parsing pulls in real libraries (SheetJS, pdf.js) that most
// pages here never need, so they're loaded from a CDN on first use — same
// pattern as Tailwind in index.html — rather than bundled for every visit.
const loadedScripts = new Map();
function loadScript(src) {
  if (!loadedScripts.has(src)) {
    loadedScripts.set(
      src,
      new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      })
    );
  }
  return loadedScripts.get(src);
}

// Excel -> the same CSV text the rest of this file already knows how to
// parse, so the one column-mapping/validation path handles every format.
async function excelToCsv(arrayBuffer) {
  await loadScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
  const workbook = window.XLSX.read(arrayBuffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return window.XLSX.utils.sheet_to_csv(sheet);
}

// PDFs have no real notion of rows/columns — pdf.js only hands back
// individual positioned text runs. This reconstructs rows by grouping runs
// that share a Y position and ordering them left-to-right, which works
// reasonably well for a PDF that's actually a printed table (e.g. a sheet
// exported "to PDF") but not for free-flowing text. Comma-joining the
// result feeds it through the same CSV parser as everything else, so a
// layout it can't make sense of is reported as a normal parse error rather
// than silently importing garbage.
async function pdfToCsv(arrayBuffer) {
  await loadScript("https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const lines = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const { items } = await page.getTextContent();
    const rowsByY = new Map();
    items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      if (!rowsByY.has(y)) rowsByY.set(y, []);
      rowsByY.get(y).push(item);
    });
    Array.from(rowsByY.keys())
      .sort((a, b) => b - a) // top to bottom
      .forEach((y) => {
        const rowItems = rowsByY.get(y).sort((a, b) => a.transform[4] - b.transform[4]); // left to right
        const text = rowItems
          .map((i) => i.str.trim())
          .filter(Boolean)
          .join(",");
        if (text) lines.push(text);
      });
  }
  return lines.join("\n");
}

// Canonical column -> internal field. Keys are normalized (trimmed,
// lowercased, whitespace-collapsed) so headers like "Private Group Pricing "
// or "SKU" all match regardless of the exact case/spacing a real export uses.
const COLUMN_MAP = {
  sku: "sku",
  "distilled when": "distilledWhen",
  "retail msrp": "retailMsrp",
  "private group pricing": "privateGroupPricing",
  notes: "notes",
};

const SAMPLE_CSV = `SKU,Distilled When,Retail MSRP,Private Group Pricing,Notes
Bardstown Bourbon Company Bourbon,Dec 2018,89.99,71,
Barton 19 year bourbon,Apr 2007,N/A,599,Not available for retailers or restaurants. Private Group or 1 West Dupont ONLY.`;

function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function parsePrice(raw) {
  const v = (raw || "").trim();
  if (!v || v.toUpperCase() === "N/A") return { ok: true, value: null };
  const n = Number(v);
  if (isNaN(n)) return { ok: false, value: null };
  return { ok: true, value: n };
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ["File is empty."] };

  const rawHeader = lines[0].split(",").map((h) => normalizeHeader(h));
  const missing = Object.keys(COLUMN_MAP).filter((h) => !rawHeader.includes(h));
  if (missing.length) {
    return { rows: [], errors: [`Missing required column(s): ${missing.join(", ")}`] };
  }

  const rows = [];
  const errors = [];
  lines.slice(1).forEach((line, idx) => {
    const cells = line.split(",").map((c) => c.trim());
    const row = {};
    rawHeader.forEach((h, i) => {
      const field = COLUMN_MAP[h];
      if (field) row[field] = cells[i] ?? "";
    });
    const rowNum = idx + 2;

    if (!row.sku) {
      errors.push(`Row ${rowNum}: missing SKU.`);
      return;
    }
    const retail = parsePrice(row.retailMsrp);
    const privateGroup = parsePrice(row.privateGroupPricing);
    if (!retail.ok || !privateGroup.ok) {
      errors.push(`Row ${rowNum}: Retail MSRP and Private Group Pricing must be a number or "N/A".`);
      return;
    }

    rows.push({
      sku: row.sku,
      distilledWhen: (row.distilledWhen || "").trim(),
      retailMsrp: retail.value,
      privateGroupPricing: privateGroup.value,
      notes: (row.notes || "").trim(),
    });
  });

  return { rows, errors };
}

export function renderInventoryUpload() {
  let csvText = "";
  let preview = { rows: [], errors: [] };
  let isProcessing = false;

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
      accept:
        ".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.pdf,application/pdf",
      class:
        "text-sm text-ivory/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold/15 file:text-gold-light file:text-xs file:font-medium hover:file:bg-gold/25 file:cursor-pointer cursor-pointer",
      onchange: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const name = file.name.toLowerCase();
        const isExcel =
          name.endsWith(".xlsx") || name.endsWith(".xls") || file.type.includes("spreadsheet") || file.type === "application/vnd.ms-excel";
        const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";

        if (!isExcel && !isPdf) {
          const reader = new FileReader();
          reader.onload = () => {
            csvText = String(reader.result);
            preview = parseCsv(csvText);
            draw();
          };
          reader.readAsText(file);
          return;
        }

        isProcessing = true;
        preview = { rows: [], errors: [] };
        draw();

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            csvText = isExcel ? await excelToCsv(reader.result) : await pdfToCsv(reader.result);
            preview = parseCsv(csvText);
          } catch (err) {
            preview = {
              rows: [],
              errors: [`Could not read that ${isExcel ? "Excel" : "PDF"} file. Try exporting it as CSV instead for the most reliable results.`],
            };
          }
          isProcessing = false;
          draw();
        };
        reader.onerror = () => {
          isProcessing = false;
          preview = { rows: [], errors: ["Could not read that file."] };
          draw();
        };
        reader.readAsArrayBuffer(file);
      },
    });

    const previewCard = isProcessing
      ? card([el("div", { class: "p-5 text-sm text-ivory/50" }, "Reading file…")], "mt-4")
      : preview.rows.length || preview.errors.length
      ? card(
          [
            el("div", { class: "p-5" }, [
              preview.errors.length
                ? el(
                    "div",
                    { class: "text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-3" },
                    preview.errors.map((e) => el("div", {}, e))
                  )
                : null,
              preview.rows.length
                ? el("div", { class: "text-sm text-noir bg-ivory font-medium rounded-lg px-4 py-2.5" }, `${preview.rows.length} barrel(s) ready to import.`)
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
            el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Upload a CSV, Excel, or PDF file"),
            fileInput,
            el(
              "p",
              { class: "text-xs text-ivory/35 mt-2" },
              "CSV is the most reliable. Excel sheets convert automatically; PDFs work best when the source is an actual table."
            ),
          ]),
          el("div", { class: "text-xs text-ivory/30" }, "— or paste CSV below —"),
          el("div", {}, [
            el(
              "span",
              { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" },
              "CSV data (columns: SKU, Distilled When, Retail MSRP, Private Group Pricing, Notes)"
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
      el("p", { class: "text-sm text-ivory/40 mb-8" }, "Bulk-add barrels from a CSV, Excel, or PDF export of the master price list."),
      // Node.replaceChildren() stringifies a null arg to the literal text
      // "null" (unlike our el() helper) — previewCard is null until the
      // first Preview click, so it must be filtered out, not passed as-is.
      ...[form, previewCard].filter(Boolean)
    );
  }

  draw();
  return wrap;
}
