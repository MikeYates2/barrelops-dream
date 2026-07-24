import { addBarrel } from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";
import { navigate } from "../router.js";

export function renderBarrelForm() {
  const values = {
    whiskeyType: "Bourbon Whiskey",
    ageYears: "",
    distiller: "",
    warehouser: "",
    mashBill: "",
    numBarrels: "",
    pricePerBarrel: "",
    samplesAvailable: "true",
  };

  const errorBox = el("div", { class: "hidden text-sm text-red-300 bg-red-500/10 border border-red-400/25 rounded-lg px-4 py-2.5 mb-4" });

  function onSubmit(e) {
    e.preventDefault();
    const required = ["whiskeyType", "ageYears", "distiller", "warehouser", "mashBill", "numBarrels", "pricePerBarrel"];
    const missing = required.filter((k) => !String(values[k]).trim());
    if (missing.length) {
      errorBox.textContent = "Please fill in all required fields before adding this barrel.";
      errorBox.classList.remove("hidden");
      return;
    }
    addBarrel({
      whiskeyType: values.whiskeyType,
      ageYears: Number(values.ageYears),
      distiller: values.distiller,
      warehouser: values.warehouser,
      mashBill: values.mashBill,
      numBarrels: Number(values.numBarrels),
      pricePerBarrel: Number(values.pricePerBarrel),
      samplesAvailable: values.samplesAvailable === "true",
    });
    navigate("/");
  }

  const form = el(
    "form",
    { class: "grid grid-cols-2 gap-4", onsubmit: onSubmit },
    [
      field(
        "Whiskey Type",
        selectInput(
          [
            { value: "Bourbon Whiskey", label: "Bourbon Whiskey" },
            { value: "Rye Whiskey", label: "Rye Whiskey" },
            { value: "Single Malt Whiskey", label: "Single Malt Whiskey" },
            { value: "Wheated Whiskey", label: "Wheated Whiskey" },
            { value: "Other", label: "Other" },
          ],
          { value: values.whiskeyType, onchange: (e) => (values.whiskeyType = e.target.value) }
        )
      ),
      field("Age (Years)", textInput({ type: "number", step: "0.1", min: "0", oninput: (e) => (values.ageYears = e.target.value) })),
      field("Distiller", textInput({ type: "text", placeholder: "e.g. MGPI of Indiana", oninput: (e) => (values.distiller = e.target.value) })),
      field("Warehouser", textInput({ type: "text", placeholder: "e.g. MGPI - Lawrenceburg", oninput: (e) => (values.warehouser = e.target.value) })),
      field("Mash Bill (C/R/W/M)", textInput({ type: "text", placeholder: "e.g. 60/36/4", oninput: (e) => (values.mashBill = e.target.value) })),
      field("# of Barrels", textInput({ type: "number", min: "1", oninput: (e) => (values.numBarrels = e.target.value) })),
      field("Price / Barrel", textInput({ type: "number", min: "0", placeholder: "e.g. 2200", oninput: (e) => (values.pricePerBarrel = e.target.value) })),
      field(
        "Samples Available",
        selectInput(
          [
            { value: "true", label: "Available" },
            { value: "false", label: "Not Available" },
          ],
          { value: values.samplesAvailable, onchange: (e) => (values.samplesAvailable = e.target.value) }
        )
      ),
      el("div", { class: "col-span-2 flex gap-3 pt-2" }, [
        button("Add Barrel", { type: "submit", variant: "gold" }),
        button("Cancel", { variant: "secondary", onClick: () => navigate("/") }),
      ]),
    ]
  );

  return el("div", { class: "px-8 py-16 max-w-2xl mx-auto" }, [
    el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "Add Barrel"),
    el("p", { class: "text-sm text-ivory/40 mb-8" }, "Add a single barrel to the inventory manually."),
    card([el("div", { class: "p-8" }, [errorBox, form])]),
  ]);
}
