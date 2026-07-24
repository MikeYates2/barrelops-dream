import { getBarrel, createPick, setPickMethod, requestDates, getState, setCustomerEmail } from "../store.js";
import { el, card, button, field, textInput, selectInput, badge } from "../ui.js";
import { renderCalendar } from "../components/calendar.js";
import { navigate } from "../router.js";

export function renderPickWizard({ barrelId }) {
  const barrel = getBarrel(barrelId);
  if (!barrel) {
    return el("div", { class: "p-8" }, [
      el("p", { class: "text-stone-500" }, "That barrel could not be found."),
      el("a", { href: "#/", class: "text-amber-700 underline text-sm" }, "Back to marketplace"),
    ]);
  }

  const state = getState();
  let step = 1;
  const contact = {
    name: "",
    email: state.currentCustomerEmail || "",
    phone: "",
    location: "",
    groupType: "private_group",
  };
  // Matches the <select>'s default option so the visible selection and
  // internal state agree even if the user never touches the dropdown.
  let method = "2A_ship_samples";
  const selectedDates = new Set();
  const errorBox = el("div", { class: "hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4" });

  const wrap = el("div", { class: "p-8 max-w-2xl mx-auto" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function stepper() {
    const steps = ["Intake", "Pick Method"];
    return el(
      "div",
      { class: "flex items-center gap-2 mb-6" },
      steps.flatMap((label, i) => {
        const n = i + 1;
        const isActive = n === step;
        const isDone = n < step;
        const dot = el(
          "div",
          {
            class: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
              isDone ? "bg-emerald-600 text-white" : isActive ? "bg-amber-800 text-white" : "bg-stone-200 text-stone-500"
            }`,
          },
          isDone ? "✓" : String(n)
        );
        const item = el("div", { class: "flex items-center gap-2" }, [dot, el("span", { class: "text-sm font-medium text-stone-600" }, label)]);
        return i < steps.length - 1 ? [item, el("div", { class: "flex-1 h-px bg-stone-200" })] : [item];
      })
    );
  }

  function step1() {
    return card([
      el("div", { class: "p-6" }, [
        el("h2", { class: "text-lg font-semibold text-stone-900 mb-1" }, "Contact Information"),
        el("p", { class: "text-sm text-stone-500 mb-5" }, "Tell us who this pick is for."),
        el("div", { class: "grid grid-cols-2 gap-4" }, [
          field("Full Name", textInput({ type: "text", value: contact.name, oninput: (e) => (contact.name = e.target.value) })),
          field("Email", textInput({ type: "email", value: contact.email, oninput: (e) => (contact.email = e.target.value) })),
          field("Phone", textInput({ type: "tel", value: contact.phone, oninput: (e) => (contact.phone = e.target.value) })),
          field(
            "Private Group or Retailer",
            selectInput(
              [
                { value: "private_group", label: "Private Group" },
                { value: "retailer", label: "Retailer" },
              ],
              { value: contact.groupType, onchange: (e) => (contact.groupType = e.target.value) }
            )
          ),
          field(
            "Location (city, state)",
            textInput({ type: "text", value: contact.location, placeholder: "e.g. Louisville, KY", oninput: (e) => (contact.location = e.target.value) }),
            null
          ),
        ]),
        el("div", { class: "flex justify-end pt-6" }, [
          button("Continue", {
            variant: "gold",
            onClick: () => {
              if (!contact.name.trim() || !contact.email.trim() || !contact.phone.trim() || !contact.location.trim()) {
                showError("Please fill in all contact fields to continue.");
                return;
              }
              errorBox.classList.add("hidden");
              step = 2;
              draw();
            },
          }),
        ]),
      ]),
    ]);
  }

  function step2() {
    const methodOptions = [
      { value: "2A_ship_samples", label: "2A — Ship Samples" },
      { value: "2B_in_person", label: "2B — In-Person Pick" },
    ];

    const calendarBlock =
      method === "2B_in_person"
        ? el("div", { class: "mt-5 pt-5 border-t border-stone-200" }, [
            el("span", { class: "block text-sm font-medium text-stone-700 mb-2" }, "Select your preferred date(s)"),
            el("p", { class: "text-xs text-stone-400 mb-3" }, "Pick up to 3 dates. Dream Spirits staff will confirm one."),
            renderCalendar({
              selected: selectedDates,
              onToggle: (iso) => {
                if (selectedDates.has(iso)) selectedDates.delete(iso);
                else if (selectedDates.size < 3) selectedDates.add(iso);
              },
            }),
          ])
        : null;

    return card([
      el("div", { class: "p-6" }, [
        el("h2", { class: "text-lg font-semibold text-stone-900 mb-1" }, "Choose Pick Method"),
        el("p", { class: "text-sm text-stone-500 mb-5" }, "How would you like to evaluate this barrel?"),
        field(
          "Pick Method",
          selectInput(methodOptions, {
            value: method,
            onchange: (e) => {
              method = e.target.value;
              draw();
            },
          })
        ),
        calendarBlock,
        el("div", { class: "flex justify-between pt-6" }, [
          button("Back", { variant: "secondary", onClick: () => { step = 1; draw(); } }),
          button("Submit Pick Request", {
            variant: "gold",
            onClick: () => {
              if (!method) {
                showError("Please select a pick method.");
                return;
              }
              if (method === "2B_in_person" && selectedDates.size === 0) {
                showError("Please select at least one preferred date.");
                return;
              }
              errorBox.classList.add("hidden");
              setCustomerEmail(contact.email.trim());
              const pick = createPick({ barrelId, contact: { ...contact, email: contact.email.trim() } });
              setPickMethod(pick.id, method);
              if (method === "2B_in_person") requestDates(pick.id, Array.from(selectedDates));
              navigate(`/pick/${pick.id}`);
            },
          }),
        ]),
      ]),
    ]);
  }

  function draw() {
    wrap.replaceChildren(
      el("a", { href: "#/", class: "text-xs text-amber-700 hover:underline" }, "← Back to Marketplace"),
      el("div", { class: "flex items-center gap-3 mt-2 mb-1" }, [
        el("h1", { class: "text-2xl font-bold text-stone-900" }, "Start a Barrel Pick"),
      ]),
      el("div", { class: "flex items-center gap-2 text-sm text-stone-500 mb-6" }, [
        badge(barrel.whiskeyType, "amber"),
        `${barrel.distiller} · ${barrel.ageYears} yrs · ${barrel.mashBill}`,
      ]),
      stepper(),
      errorBox,
      step === 1 ? step1() : step2()
    );
  }

  draw();
  return wrap;
}
