import { getState, getCustomerProfile, updateCustomerProfile, setCustomerPassword, RETAILER_STATES } from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";

// Saving either form calls a store function that notifies subscribers, which
// (per main.js's global re-render-on-any-change) tears down and rebuilds
// this whole view synchronously — orphaning the closure the submit handler
// is running in before it can flip its own success box visible. Hoisting
// these flags to module scope lets the *fresh* render (which is what the
// user actually sees) know a save just happened.
let justSavedDetails = false;
let justSavedPassword = false;

export function renderMyAccount() {
  const state = getState();
  const email = state.currentCustomerEmail;
  const profile = getCustomerProfile(email) || {};

  const details = {
    name: profile.name || "",
    groupType: profile.groupType || "private_group",
    retailerState: profile.retailerState || "",
    street: (profile.address && profile.address.street) || "",
    city: (profile.address && profile.address.city) || "",
    state: (profile.address && profile.address.state) || "",
    zip: (profile.address && profile.address.zip) || "",
  };
  const passwordForm = { newPassword: "", confirmPassword: "" };

  const detailsError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });
  const detailsSuccess = el("div", { class: "hidden text-sm text-gold-light bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-2.5 mb-4" }, "Saved.");
  const passwordError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });
  const passwordSuccess = el("div", { class: "hidden text-sm text-gold-light bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-2.5 mb-4" }, "Password updated.");

  const wrap = el("div", { class: "px-8 py-16 max-w-2xl mx-auto" });

  function draw() {
    detailsError.classList.add("hidden");
    passwordError.classList.add("hidden");
    detailsSuccess.classList.toggle("hidden", !justSavedDetails);
    passwordSuccess.classList.toggle("hidden", !justSavedPassword);
    justSavedDetails = false;
    justSavedPassword = false;

    const retailerStateField =
      details.groupType === "retailer"
        ? field(
            "Licensing State",
            selectInput(
              [{ value: "", label: "Select your state..." }, ...RETAILER_STATES],
              { value: details.retailerState, onchange: (e) => (details.retailerState = e.target.value) }
            )
          )
        : null;

    const detailsForm = el(
      "form",
      {
        class: "space-y-5",
        onsubmit: (e) => {
          e.preventDefault();
          detailsError.classList.add("hidden");
          if (!details.name.trim()) {
            detailsError.textContent = "Please enter your name.";
            detailsError.classList.remove("hidden");
            return;
          }
          if (details.groupType === "retailer" && !details.retailerState) {
            detailsError.textContent = "Please select your licensing state.";
            detailsError.classList.remove("hidden");
            return;
          }
          justSavedDetails = true;
          updateCustomerProfile(email, {
            name: details.name.trim(),
            groupType: details.groupType,
            retailerState: details.groupType === "retailer" ? details.retailerState : null,
            address: { street: details.street.trim(), city: details.city.trim(), state: details.state.trim(), zip: details.zip.trim() },
          });
        },
      },
      [
        el("div", { class: "grid grid-cols-2 gap-5" }, [
          field("Full Name", textInput({ type: "text", value: details.name, oninput: (e) => (details.name = e.target.value) })),
          field("Email", textInput({ type: "email", value: email, disabled: true, class: "w-full rounded-lg bg-white/[0.02] border border-white/10 px-3.5 py-2.5 text-sm text-ivory/40 cursor-not-allowed" }), "Contact Dream Spirits staff to change your email."),
          field(
            "Customer Status",
            selectInput(
              [
                { value: "private_group", label: "Private Group" },
                { value: "retailer", label: "Retailer" },
              ],
              {
                value: details.groupType,
                onchange: (e) => {
                  details.groupType = e.target.value;
                  draw();
                },
              }
            )
          ),
          retailerStateField,
        ]),
        el("div", { class: "h-px bg-white/10" }),
        el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest" }, "Address"),
        el("div", { class: "grid grid-cols-2 gap-5" }, [
          el("div", { class: "col-span-2" }, field("Street Address", textInput({ type: "text", value: details.street, oninput: (e) => (details.street = e.target.value) }))),
          field("City", textInput({ type: "text", value: details.city, oninput: (e) => (details.city = e.target.value) })),
          field("State", textInput({ type: "text", placeholder: "e.g. KY", value: details.state, oninput: (e) => (details.state = e.target.value) })),
          field("ZIP Code", textInput({ type: "text", value: details.zip, oninput: (e) => (details.zip = e.target.value) })),
        ]),
        el("div", { class: "flex justify-end pt-2" }, [button("Save Changes", { variant: "gold", type: "submit" })]),
      ]
    );

    const passwordFormNode = el(
      "form",
      {
        class: "space-y-5",
        onsubmit: (e) => {
          e.preventDefault();
          passwordError.classList.add("hidden");
          if (!passwordForm.newPassword || passwordForm.newPassword.length < 4) {
            passwordError.textContent = "Please choose a password of at least 4 characters.";
            passwordError.classList.remove("hidden");
            return;
          }
          if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            passwordError.textContent = "Passwords don't match.";
            passwordError.classList.remove("hidden");
            return;
          }
          justSavedPassword = true;
          const result = setCustomerPassword(email, passwordForm.newPassword);
          if (!result.ok) {
            justSavedPassword = false;
            passwordError.textContent = result.error;
            passwordError.classList.remove("hidden");
            return;
          }
        },
      },
      [
        el("div", { class: "grid grid-cols-2 gap-5" }, [
          field("New Password", textInput({ type: "password", autocomplete: "new-password", value: passwordForm.newPassword, oninput: (e) => (passwordForm.newPassword = e.target.value) })),
          field("Confirm Password", textInput({ type: "password", autocomplete: "new-password", value: passwordForm.confirmPassword, oninput: (e) => (passwordForm.confirmPassword = e.target.value) })),
        ]),
        el("div", { class: "flex justify-end pt-2" }, [button("Update Password", { variant: "secondary", type: "submit" })]),
      ]
    );

    wrap.replaceChildren(
      el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "My Account"),
      el("p", { class: "text-sm text-ivory/40 mb-8" }, "View and update your saved details."),
      card([el("div", { class: "p-8" }, [detailsError, detailsSuccess, detailsForm])], "mb-6"),
      card([
        el("div", { class: "p-8" }, [
          el("h2", { class: "font-serif text-xl text-ivory mb-1" }, "Password"),
          el("p", { class: "text-sm text-ivory/40 mb-6" }, "Change the password you use to sign in."),
          passwordError,
          passwordSuccess,
          passwordFormNode,
        ]),
      ])
    );
  }

  draw();
  return wrap;
}
