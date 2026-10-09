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
// before it can switch its own local state to 'pending'. Hoisting the
// just-signed-up email to module scope lets the *fresh* render (what the
// user actually sees) pick up the pending state immediately.
let pendingSignupEmail = null;

export function renderLogin() {
  let activeTab = "customer"; // 'customer' | 'staff'
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-5 w-full max-w-md" });

  const justSignedUpEmail = pendingSignupEmail;
  pendingSignupEmail = null;

  // Explicit toggle the customer controls directly — not inferred from what
  // they type. 'setPassword' and 'pending' are sub-states that only ever
  // surface while signing in (a legacy/freshly-approved account with no
  // password yet, or one still awaiting staff approval), discovered at
  // submit time rather than chosen up front.
  let customerIntent = "signin"; // 'signin' | 'signup'
  let customerSubState = justSignedUpEmail ? "pending" : "normal"; // 'normal' | 'setPassword' | 'pending'
  let recognizedName = "";

  // Hoisted above draw() so typed values survive a redraw triggered by
  // toggling "Retailer" (which needs to reveal the state field) — recreating
  // these inside draw() would wipe whatever the user had already typed.
  const customerForm = { name: "", email: justSignedUpEmail || "", password: "", confirmPassword: "", groupType: "private_group", retailerState: "" };
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

    const intentToggle = el("div", { class: "flex gap-1 p-1 rounded-full glass border border-white/10 mb-6" }, [
      el("button", {
        type: "button",
        class: `flex-1 px-4 py-2 rounded-full text-sm tracking-wide transition-colors ${
          customerIntent === "signin" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Sign In",
        onclick: () => {
          customerIntent = "signin";
          customerSubState = "normal";
          draw();
        },
      }),
      el("button", {
        type: "button",
        class: `flex-1 px-4 py-2 rounded-full text-sm tracking-wide transition-colors ${
          customerIntent === "signup" ? "bg-gold text-noir font-semibold" : "text-ivory/50"
        }`,
        textContent: "Create Account",
        onclick: () => {
          customerIntent = "signup";
          customerSubState = "normal";
          draw();
        },
      }),
    ]);

    const duplicateAccountNotice =
      customerIntent === "signup"
        ? el(
            "div",
            { class: "text-xs text-ivory/60 bg-gold/5 border-l-2 border-gold/40 rounded-r-lg px-4 py-2.5 mb-5 leading-relaxed" },
            "Groups or Stores only need one account. Multiple accounts from the same group or store will be rejected."
          )
        : null;

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
      customerSubState === "setPassword"
        ? `Welcome back${recognizedName ? `, ${recognizedName}` : ""} — let's set a password for your account.`
        : null;

    const emailField = field(
      "Email",
      textInput({
        type: "email",
        value: customerForm.email,
        oninput: (e) => (customerForm.email = e.target.value),
      }),
      emailHint
    );

    const passwordFields =
      customerSubState === "setPassword"
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
        : customerIntent === "signin"
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
        : [
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
          ];

    const submitLabel = customerSubState === "setPassword" ? "Set Password & Continue" : customerIntent === "signin" ? "Sign In" : "Create Account";

    const customerFormBody =
      customerSubState === "pending"
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
                customerSubState = "normal";
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
                if (!customerForm.email.trim()) {
                  showError("Please enter your email.");
                  return;
                }

                if (customerSubState === "setPassword") {
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
                      customerSubState = "pending";
                      draw();
                      return;
                    }
                    showError(result.error);
                    return;
                  }
                  // My Account is always the first thing a customer sees
                  // after signing in — not just when the profile is
                  // incomplete — see the route guards in main.js for the
                  // persistent block on Inventory/Pick routes.
                  navigate("/account");
                  return;
                }

                if (customerIntent === "signin") {
                  if (!customerForm.password) {
                    showError("Please enter your password.");
                    return;
                  }
                  const result = loginAsCustomer({ email: customerForm.email.trim(), password: customerForm.password });
                  if (!result.ok) {
                    if (result.needsPasswordSetup) {
                      const profile = getCustomerProfile(customerForm.email);
                      recognizedName = (profile && profile.name) || "";
                      customerSubState = "setPassword";
                      draw();
                      return;
                    }
                    if (result.pending) {
                      customerSubState = "pending";
                      draw();
                      return;
                    }
                    showError(result.error);
                    return;
                  }
                  // My Account is always the first thing a customer sees
                  // after signing in — not just when the profile is
                  // incomplete — see the route guards in main.js for the
                  // persistent block on Inventory/Pick routes.
                  navigate("/account");
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
              intentToggle,
              duplicateAccountNotice,
              emailField,
              customerIntent === "signup" && customerSubState !== "setPassword"
                ? field("Full Name", textInput({ type: "text", value: customerForm.name, oninput: (e) => (customerForm.name = e.target.value) }))
                : null,
              ...passwordFields,
              customerIntent === "signup" && customerSubState !== "setPassword"
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
              customerIntent === "signup" && customerSubState !== "setPassword" ? retailerStateField : null,
              button(submitLabel, { variant: "gold", type: "submit", extraClass: "w-full mt-2" }),
            ].filter(Boolean)
          );

    const formCard =
      activeTab === "customer"
        ? card([
            el("div", { class: "p-5 sm:p-8" }, [
              el("h2", { class: "font-serif text-2xl text-ivory mb-1" }, customerSubState === "pending" ? "Almost there." : "Welcome."),
              el(
                "p",
                { class: "text-sm text-ivory/40 mb-6" },
                customerSubState === "pending"
                  ? "One more step before you can sign in."
                  : "Sign in to track your picks, or create an account to get started."
              ),
              customerFormBody,
            ]),
          ])
        : card([
            el("div", { class: "p-5 sm:p-8" }, [
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
