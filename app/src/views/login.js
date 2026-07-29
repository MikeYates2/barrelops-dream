import { loginAsCustomer, loginAsStaff, RETAILER_STATES } from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";
import { navigate } from "../router.js";

export function renderLogin() {
  let activeTab = "customer"; // 'customer' | 'staff'
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-5 w-full max-w-md" });

  // Hoisted above draw() so typed values survive a redraw triggered by
  // toggling "Retailer" (which needs to reveal the state field) — recreating
  // these inside draw() would wipe whatever the user had already typed.
  const customerForm = { name: "", email: "", groupType: "private_group", retailerState: "" };
  const staffForm = { name: "", accessCode: "" };

  const wrap = el("div", { class: "min-h-screen flex flex-col items-center justify-center px-6 py-16" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function draw() {
    errorBox.classList.add("hidden");

    const tabs = el("div", { class: "flex gap-1 p-1 rounded-full glass border border-white/10 mb-8" }, [
      el("button", {
        type: "button",
        class: `px-6 py-2 rounded-full text-sm tracking-wide transition-colors ${
          activeTab === "customer" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Customer",
        onclick: () => {
          activeTab = "customer";
          draw();
        },
      }),
      el("button", {
        type: "button",
        class: `px-6 py-2 rounded-full text-sm tracking-wide transition-colors ${
          activeTab === "staff" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Dream Staff",
        onclick: () => {
          activeTab = "staff";
          draw();
        },
      }),
    ]);

    const retailerStateField =
      customerForm.groupType === "retailer"
        ? field(
            "State (Retail License)",
            selectInput(
              [{ value: "", label: "Select your state..." }, ...RETAILER_STATES],
              { value: customerForm.retailerState, onchange: (e) => (customerForm.retailerState = e.target.value) }
            )
          )
        : null;

    const formCard =
      activeTab === "customer"
        ? card([
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Welcome."),
              el("p", { class: "text-sm text-ivory/40 mb-6" }, "Enter your details to browse the collection and track your picks."),
              el(
                "form",
                {
                  class: "space-y-5",
                  onsubmit: (e) => {
                    e.preventDefault();
                    if (!customerForm.name.trim() || !customerForm.email.trim()) {
                      showError("Please enter your name and email.");
                      return;
                    }
                    if (customerForm.groupType === "retailer" && !customerForm.retailerState) {
                      showError("Please select your state.");
                      return;
                    }
                    loginAsCustomer({
                      name: customerForm.name.trim(),
                      email: customerForm.email.trim(),
                      groupType: customerForm.groupType,
                      retailerState: customerForm.retailerState,
                    });
                    navigate("/");
                  },
                },
                [
                  field("Full Name", textInput({ type: "text", value: customerForm.name, oninput: (e) => (customerForm.name = e.target.value) })),
                  field("Email", textInput({ type: "email", value: customerForm.email, oninput: (e) => (customerForm.email = e.target.value) })),
                  field(
                    "Private Group or Retailer",
                    selectInput(
                      [
                        { value: "private_group", label: "Private Group" },
                        { value: "retailer", label: "Retailer" },
                      ],
                      {
                        value: customerForm.groupType,
                        onchange: (e) => {
                          customerForm.groupType = e.target.value;
                          draw();
                        },
                      }
                    )
                  ),
                  retailerStateField,
                  button("Continue as Customer", { variant: "gold", type: "submit", extraClass: "w-full mt-2" }),
                ]
              ),
            ]),
          ])
        : card([
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, "Staff Sign In"),
              el("p", { class: "text-sm text-ivory/40 mb-6" }, "For Dream Spirits team members only."),
              el(
                "form",
                {
                  class: "space-y-5",
                  onsubmit: (e) => {
                    e.preventDefault();
                    if (!staffForm.name.trim() || !staffForm.accessCode.trim()) {
                      showError("Please enter your name and access code.");
                      return;
                    }
                    const result = loginAsStaff({ name: staffForm.name.trim(), accessCode: staffForm.accessCode.trim() });
                    if (!result.ok) {
                      showError(result.error);
                      return;
                    }
                    navigate("/dashboard");
                  },
                },
                [
                  field("Full Name", textInput({ type: "text", value: staffForm.name, oninput: (e) => (staffForm.name = e.target.value) })),
                  field("Access Code", textInput({ type: "password", value: staffForm.accessCode, oninput: (e) => (staffForm.accessCode = e.target.value) })),
                  button("Sign In", { variant: "gold", type: "submit", extraClass: "w-full mt-2" }),
                ]
              ),
            ]),
          ]);

    wrap.replaceChildren(
      el("img", { src: "/src/assets/dream-spirits-logo.png", alt: "Dream Spirits", class: "w-20 h-20 object-contain mb-6" }),
      el("div", { class: "text-center mb-10" }, [
        el("h1", { class: "font-serif text-4xl text-ivory mb-2" }, "Dream Spirits"),
        el("p", { class: "text-xs text-gold/70 uppercase tracking-[0.25em]" }, "Barrel Pick Ops"),
      ]),
      tabs,
      errorBox,
      el("div", { class: "w-full max-w-md" }, formCard)
    );
  }

  draw();
  return wrap;
}
