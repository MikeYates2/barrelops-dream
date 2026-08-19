import {
  signUpCustomer,
  loginAsCustomer,
  setCustomerPassword,
  loginAsStaff,
  getCustomerProfile,
  RETAILER_STATES,
} from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";
import { navigate } from "../router.js";

// signUpCustomer() calls notify(), which (per main.js's global
// re-render-on-any-change) tears down and rebuilds this whole view
// synchronously — orphaning the closure the submit handler is running in
// before it can switch its own local customerMode to 'pending'. Hoisting the
// just-signed-up email to module scope lets the *fresh* render (what the
// user actually sees) pick up the pending state immediately.
let pendingSignupEmail = null;

export function renderLogin() {
  let activeTab = "customer"; // 'customer' | 'staff'
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-5 w-full max-w-md" });

  // Hoisted above draw() so typed values survive a redraw triggered by
  // toggling "Retailer" (which needs to reveal the state field) — recreating
  // these inside draw() would wipe whatever the user had already typed.
  const customerForm = { name: "", email: pendingSignupEmail || "", password: "", confirmPassword: "", groupType: "private_group", retailerState: "" };
  const staffForm = { name: "", accessCode: "" };

  // Driven by looking up the typed email against saved profiles:
  //  - 'signup'    — no account with that email yet, collect everything
  //  - 'signin'    — account exists and already has a password
  //  - 'setPassword' — account exists (legacy or freshly approved) but has
  //                    never had a password set
  //  - 'pending'   — account exists but is still awaiting staff approval
  let customerMode = "signup";
  let recognizedName = "";

  if (pendingSignupEmail) {
    const freshProfile = getCustomerProfile(pendingSignupEmail);
    recognizedName = (freshProfile && freshProfile.name) || "";
    customerMode = "pending";
    pendingSignupEmail = null;
  }

  const wrap = el("div", { class: "min-h-screen flex flex-col items-center justify-center px-6 py-16" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  // Re-run whenever the email changes (on blur, and again at submit time in
  // case Enter was pressed before the field ever blurred) so the mode never
  // goes stale relative to what's actually typed.
  function resolveCustomerMode() {
    const profile = getCustomerProfile(customerForm.email);
    if (!profile) {
      customerMode = "signup";
      recognizedName = "";
      return;
    }
    recognizedName = profile.name || "";
    if (profile.approvalStatus === "pending") {
      customerMode = "pending";
      return;
    }
    if (!profile.password) {
      customerMode = "setPassword";
      return;
    }
    customerMode = "signin";
    // Nothing left to ask them for — pre-fill so a resubmit after a typo
    // doesn't lose their group type.
    customerForm.groupType = profile.groupType || customerForm.groupType;
    customerForm.retailerState = profile.retailerState || customerForm.retailerState;
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

    const emailHint =
      customerMode === "signin"
        ? `Welcome back${recognizedName ? `, ${recognizedName}` : ""} — enter your password to continue.`
        : customerMode === "setPassword"
        ? `Welcome back${recognizedName ? `, ${recognizedName}` : ""} — let's set a password for your account.`
        : customerMode === "pending"
        ? null // the pending state replaces the whole form below instead
        : null;

    const emailField = field(
      "Email",
      textInput({
        type: "email",
        value: customerForm.email,
        oninput: (e) => {
          customerForm.email = e.target.value;
          // Stale until the next blur/submit — avoids flashing the wrong
          // mode's fields while they're still mid-edit.
          customerMode = "signup";
        },
        onblur: () => {
          resolveCustomerMode();
          draw();
        },
      }),
      emailHint
    );

    const passwordFields =
      customerMode === "signin"
        ? [
            field(
              "Password",
              textInput({
                type: "password",
                autocomplete: "current-password",
                value: customerForm.password,
                oninput: (e) => (customerForm.password = e.target.value),
              })
            ),
          ]
        : customerMode === "setPassword"
        ? [
            field(
              "Create a Password",
              textInput({
                type: "password",
                autocomplete: "new-password",
                value: customerForm.password,
                oninput: (e) => (customerForm.password = e.target.value),
              })
            ),
            field(
              "Confirm Password",
              textInput({
                type: "password",
                autocomplete: "new-password",
                value: customerForm.confirmPassword,
                oninput: (e) => (customerForm.confirmPassword = e.target.value),
              })
            ),
          ]
        : customerMode === "signup"
        ? [
            field(
              "Password",
              textInput({
                type: "password",
                autocomplete: "new-password",
                value: customerForm.password,
                oninput: (e) => (customerForm.password = e.target.value),
              })
            ),
            field(
              "Confirm Password",
              textInput({
                type: "password",
                autocomplete: "new-password",
                value: customerForm.confirmPassword,
                oninput: (e) => (customerForm.confirmPassword = e.target.value),
              })
            ),
          ]
        : [];

    const customerFormBody =
      customerMode === "pending"
        ? el("div", { class: "space-y-4" }, [
            el(
              "p",
              { class: "text-sm text-ivory/60 leading-relaxed" },
              `Your account (${customerForm.email}) is awaiting approval from Dream Spirits staff. We'll be in touch once it's ready — check back soon.`
            ),
            button("Use a Different Email", {
              variant: "secondary",
              extraClass: "w-full",
              onClick: () => {
                customerForm.email = "";
                customerForm.password = "";
                customerForm.confirmPassword = "";
                customerMode = "signup";
                draw();
              },
            }),
          ])
        : el(
            "form",
            {
              class: "space-y-5",
              onsubmit: (e) => {
                e.preventDefault();
                resolveCustomerMode();

                if (!customerForm.email.trim()) {
                  showError("Please enter your email.");
                  return;
                }

                if (customerMode === "pending") {
                  draw();
                  return;
                }

                if (customerMode === "signin") {
                  if (!customerForm.password) {
                    showError("Please enter your password.");
                    return;
                  }
                  const result = loginAsCustomer({ email: customerForm.email.trim(), password: customerForm.password });
                  if (!result.ok) {
                    if (result.pending || result.needsPasswordSetup) {
                      resolveCustomerMode();
                      draw();
                      return;
                    }
                    showError(result.error);
                    return;
                  }
                  navigate("/");
                  return;
                }

                if (customerMode === "setPassword") {
                  if (!customerForm.password || customerForm.password.length < 4) {
                    showError("Please choose a password of at least 4 characters.");
                    return;
                  }
                  if (customerForm.password !== customerForm.confirmPassword) {
                    showError("Passwords don't match.");
                    return;
                  }
                  const setResult = setCustomerPassword(customerForm.email.trim(), customerForm.password);
                  if (!setResult.ok) {
                    showError(setResult.error);
                    return;
                  }
                  const result = loginAsCustomer({ email: customerForm.email.trim(), password: customerForm.password });
                  if (!result.ok) {
                    if (result.pending) {
                      resolveCustomerMode();
                      draw();
                      return;
                    }
                    showError(result.error);
                    return;
                  }
                  navigate("/");
                  return;
                }

                // signup
                if (!customerForm.name.trim()) {
                  showError("Please enter your name.");
                  return;
                }
                if (!customerForm.password || customerForm.password.length < 4) {
                  showError("Please choose a password of at least 4 characters.");
                  return;
                }
                if (customerForm.password !== customerForm.confirmPassword) {
                  showError("Passwords don't match.");
                  return;
                }
                if (customerForm.groupType === "retailer" && !customerForm.retailerState) {
                  showError("Please select your state.");
                  return;
                }
                pendingSignupEmail = customerForm.email.trim().toLowerCase();
                const result = signUpCustomer({
                  name: customerForm.name.trim(),
                  email: customerForm.email.trim(),
                  password: customerForm.password,
                  groupType: customerForm.groupType,
                  retailerState: customerForm.retailerState,
                });
                if (!result.ok) {
                  pendingSignupEmail = null;
                  showError(result.error);
                  return;
                }
              },
            },
            [
              emailField,
              customerMode === "signup" ? field("Full Name", textInput({ type: "text", value: customerForm.name, oninput: (e) => (customerForm.name = e.target.value) })) : null,
              ...passwordFields,
              customerMode === "signup"
                ? field(
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
                  )
                : null,
              customerMode === "signup" ? retailerStateField : null,
              button(
                customerMode === "signin" ? "Sign In" : customerMode === "setPassword" ? "Set Password & Continue" : "Create Account",
                { variant: "gold", type: "submit", extraClass: "w-full mt-2" }
              ),
            ].filter(Boolean)
          );

    const formCard =
      activeTab === "customer"
        ? card([
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, customerMode === "pending" ? "Almost there." : "Welcome."),
              el(
                "p",
                { class: "text-sm text-ivory/40 mb-6" },
                customerMode === "pending" ? "One more step before you can sign in." : "Enter your details to browse the collection and track your picks."
              ),
              customerFormBody,
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
