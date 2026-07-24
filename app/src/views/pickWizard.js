import { getBarrel, createPick, setPickMethod, requestDates, getState, setCustomerEmail } from "../store.js";
import { el, card, button, field, textInput, selectInput, badge } from "../ui.js";
import { renderCalendar } from "../components/calendar.js";
import { navigate } from "../router.js";

export function renderPickWizard({ barrelId }) {
  const barrel = getBarrel(barrelId);
  if (!barrel) {
    return el("div", { class: "px-8 py-16 max-w-2xl mx-auto" }, [
      el("p", { class: "text-ivory/50" }, "That barrel could not be found."),
      el("a", { href: "#/", class: "text-gold underline text-sm" }, "Back to marketplace"),
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
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });

  const wrap = el("div", { class: "px-8 py-16 max-w-2xl mx-auto" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function stepper() {
    const steps = ["Intake", "Pick Method"];
    return el(
      "div",
      { class: "flex items-center gap-2 mb-8" },
      steps.flatMap((label, i) => {
        const n = i + 1;
        const isActive = n === step;
        const isDone = n < step;
        const dot = el(
          "div",
          {
            class: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
              isDone
                ? "bg-ivory text-noir"
                : isActive
                ? "bg-gradient-to-b from-gold-light to-gold-dark text-noir shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                : "bg-white/[0.06] text-ivory/40 border border-white/10"
            }`,
          },
          isDone ? "✓" : String(n)
        );
        const item = el("div", { class: "flex items-center gap-2" }, [dot, el("span", { class: "text-sm tracking-wide text-ivory/60" }, label)]);
        return i < steps.length - 1 ? [item, el("div", { class: "flex-1 h-px bg-white/10" })] : [item];
      })
    );
  }

  function step1() {
    return card([
      el("div", { class: "p-8" }, [
        el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Contact Information"),
        el("p", { class: "text-sm text-ivory/40 mb-6" }, "Tell us who this pick is for."),
        el("div", { class: "grid grid-cols-2 gap-5" }, [
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
        el("div", { class: "flex justify-end pt-8" }, [
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
        ? el("div", { class: "mt-6 pt-6 border-t border-white/10" }, [
            el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Select your preferred date(s)"),
            el("p", { class: "text-xs text-ivory/35 mb-4" }, "Pick up to 3 dates. Dream Spirits staff will confirm one."),
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
      el("div", { class: "p-8" }, [
        el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Choose Pick Method"),
        el("p", { class: "text-sm text-ivory/40 mb-6" }, "How would you like to evaluate this barrel?"),
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
        el("div", { class: "flex justify-between pt-8" }, [
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
      el("a", { href: "#/", class: "text-xs text-gold/70 hover:text-gold transition-colors" }, "← Back to Marketplace"),
      el("div", { class: "flex items-center gap-3 mt-3 mb-2" }, [
        el("h1", { class: "font-serif text-4xl text-ivory" }, "Start a Barrel Pick"),
      ]),
      el("div", { class: "flex items-center gap-2 text-sm text-ivory/40 mb-8" }, [
        badge(barrel.whiskeyType, "gold"),
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
