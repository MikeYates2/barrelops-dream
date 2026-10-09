import { addBarrel } from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";
import { navigate } from "../router.js";

export function renderBarrelForm() {
  const values = {
    sku: "",
    distilledWhen: "",
    retailMsrp: "",
    privateGroupPricing: "",
    notes: "",
    status: "available",
  };

  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });

  function onSubmit(e) {
    e.preventDefault();
    if (!values.sku.trim()) {
      errorBox.textContent = "Please enter a SKU before adding this barrel.";
      errorBox.classList.remove("hidden");
      return;
    }
    addBarrel({
      sku: values.sku.trim(),
      distilledWhen: values.distilledWhen.trim(),
      retailMsrp: values.retailMsrp.trim() === "" ? null : Number(values.retailMsrp),
      privateGroupPricing: values.privateGroupPricing.trim() === "" ? null : Number(values.privateGroupPricing),
      notes: values.notes.trim(),
      status: values.status,
    });
    navigate("/");
  }

  const form = el(
    "form",
    { class: "grid grid-cols-1 sm:grid-cols-2 gap-4", onsubmit: onSubmit },
    [
      field(
        "SKU",
        textInput({ type: "text", placeholder: "e.g. Bardstown Bourbon Company Bourbon", oninput: (e) => (values.sku = e.target.value) }),
        null
      ),
      field("Distilled When", textInput({ type: "text", placeholder: "e.g. Dec 2018", oninput: (e) => (values.distilledWhen = e.target.value) })),
      field(
        "Retail MSRP ($/bottle)",
        textInput({ type: "number", step: "0.01", min: "0", placeholder: "e.g. 89.99", oninput: (e) => (values.retailMsrp = e.target.value) }),
        "Leave blank if not available for retail."
      ),
      field(
        "Private Group Pricing ($/bottle)",
        textInput({ type: "number", step: "0.01", min: "0", placeholder: "e.g. 71.00", oninput: (e) => (values.privateGroupPricing = e.target.value) }),
        "Leave blank if not available for private groups."
      ),
      field(
        "Status",
        selectInput(
          [
            { value: "available", label: "Available" },
            { value: "not_available", label: "Not Available" },
          ],
          { value: values.status, onchange: (e) => (values.status = e.target.value) }
        )
      ),
      el("div", { class: "sm:col-span-2" }, field("Notes", textInput({ type: "text", placeholder: "Optional — restrictions, condition, etc.", oninput: (e) => (values.notes = e.target.value) }))),
      el("div", { class: "sm:col-span-2 flex flex-wrap gap-3 pt-2" }, [
        button("Add Barrel", { type: "submit", variant: "gold" }),
        button("Cancel", { variant: "secondary", onClick: () => navigate("/") }),
      ]),
    ]
  );

  return el("div", { class: "px-4 py-8 sm:px-8 sm:py-16 max-w-2xl mx-auto" }, [
    el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "Add Barrel"),
    el("p", { class: "text-sm text-ivory/40 mb-8" }, "Add a single barrel to the inventory manually."),
    card([el("div", { class: "p-5 sm:p-8" }, [errorBox, form])]),
  ]);
}
