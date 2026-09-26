import { getState, getCustomerProfile, updateCustomerProfile, setCustomerPassword, getMissingProfileFields, isValidPhone, isValidZip, RETAILER_STATES } from "../store.js";
import { el, card, button, field, textInput, selectInput } from "../ui.js";

// Saving any of these forms calls a store function that notifies subscribers,
// which (per main.js's global re-render-on-any-change) tears down and
// rebuilds this whole view synchronously — orphaning the closure the submit
// handler is running in before it can flip its own success box visible.
// Hoisting these flags to module scope lets the *fresh* render (which is
// what the user actually sees) know a save just happened.
let justSavedDetails = false;
let justSavedLogo = false;
let justSavedPassword = false;

const LOGO_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"];

export function renderMyAccount() {
  const state = getState();
  const email = state.currentCustomerEmail;
  const profile = getCustomerProfile(email) || {};

  const details = {
    name: profile.name || "",
    phone: profile.phone || "",
    groupType: profile.groupType || "private_group",
    groupName: profile.groupName || "",
    retailerState: profile.retailerState || "",
    street: (profile.address && profile.address.street) || "",
    city: (profile.address && profile.address.city) || "",
    state: (profile.address && profile.address.state) || "",
    zip: (profile.address && profile.address.zip) || "",
    instagram: profile.instagram || "",
    facebook: profile.facebook || "",
    tiktok: profile.tiktok || "",
  };
  const passwordForm = { newPassword: "", confirmPassword: "" };

  const detailsError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });
  const detailsSuccess = el("div", { class: "hidden text-sm text-gold-light bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-2.5 mb-4" }, "Saved.");
  const logoError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });
  const logoSuccess = el("div", { class: "hidden text-sm text-gold-light bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-2.5 mb-4" }, "Logo saved.");
  const passwordError = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });
  const passwordSuccess = el("div", { class: "hidden text-sm text-gold-light bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-2.5 mb-4" }, "Password updated.");

  const wrap = el("div", { class: "px-8 py-16 max-w-2xl mx-auto" });

  function draw() {
    detailsError.classList.add("hidden");
    logoError.classList.add("hidden");
    passwordError.classList.add("hidden");
    detailsSuccess.classList.toggle("hidden", !justSavedDetails);
    logoSuccess.classList.toggle("hidden", !justSavedLogo);
    passwordSuccess.classList.toggle("hidden", !justSavedPassword);
    justSavedDetails = false;
    justSavedLogo = false;
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

    const groupNameField =
      details.groupType === "private_group"
        ? field("Group Name", textInput({ type: "text", value: details.groupName, oninput: (e) => (details.groupName = e.target.value) }))
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
          if (!details.phone.trim()) {
            detailsError.textContent = "Please enter your phone number.";
            detailsError.classList.remove("hidden");
            return;
          }
          if (!isValidPhone(details.phone)) {
            detailsError.textContent = "Please enter a valid phone number (at least 10 digits), e.g. 502-555-0123.";
            detailsError.classList.remove("hidden");
            return;
          }
          if (details.zip.trim() && !isValidZip(details.zip)) {
            detailsError.textContent = "Please enter a valid ZIP code, e.g. 40202 or 40202-1234.";
            detailsError.classList.remove("hidden");
            return;
          }
          if (details.groupType === "retailer" && !details.retailerState) {
            detailsError.textContent = "Please select your licensing state.";
            detailsError.classList.remove("hidden");
            return;
          }
          if (details.groupType === "private_group" && !details.groupName.trim()) {
            detailsError.textContent = "Please enter your group name.";
            detailsError.classList.remove("hidden");
            return;
          }
          justSavedDetails = true;
          updateCustomerProfile(email, {
            name: details.name.trim(),
            phone: details.phone.trim(),
            groupType: details.groupType,
            groupName: details.groupType === "private_group" ? details.groupName.trim() : null,
            retailerState: details.groupType === "retailer" ? details.retailerState : null,
            address: { street: details.street.trim(), city: details.city.trim(), state: details.state.trim(), zip: details.zip.trim() },
            instagram: details.instagram.trim(),
            facebook: details.facebook.trim(),
            tiktok: details.tiktok.trim(),
          });
        },
      },
      [
        el("div", { class: "grid grid-cols-2 gap-5" }, [
          field("Full Name", textInput({ type: "text", value: details.name, oninput: (e) => (details.name = e.target.value) })),
          field("Email", textInput({ type: "email", value: email, disabled: true, class: "w-full rounded-lg bg-white/[0.02] border border-white/10 px-3.5 py-2.5 text-sm text-ivory/40 cursor-not-allowed" }), "Contact Dream Spirits staff to change your email."),
          field("Phone", textInput({ type: "tel", value: details.phone, oninput: (e) => (details.phone = e.target.value) })),
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
          groupNameField,
        ]),
        el("div", { class: "h-px bg-white/10" }),
        el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest" }, "Shipping Address"),
        el("div", { class: "grid grid-cols-2 gap-5" }, [
          el("div", { class: "col-span-2" }, field("Street Address", textInput({ type: "text", value: details.street, oninput: (e) => (details.street = e.target.value) }))),
          field("City", textInput({ type: "text", value: details.city, oninput: (e) => (details.city = e.target.value) })),
          field("State", textInput({ type: "text", placeholder: "e.g. KY", value: details.state, oninput: (e) => (details.state = e.target.value) })),
          field("ZIP Code", textInput({ type: "text", value: details.zip, oninput: (e) => (details.zip = e.target.value) })),
        ]),
        el("div", { class: "h-px bg-white/10" }),
        el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest" }, "Social Media"),
        el("div", { class: "grid grid-cols-3 gap-5" }, [
          field("Instagram", textInput({ type: "text", placeholder: "@handle", value: details.instagram, oninput: (e) => (details.instagram = e.target.value) })),
          field("Facebook", textInput({ type: "text", placeholder: "@handle", value: details.facebook, oninput: (e) => (details.facebook = e.target.value) })),
          field("TikTok", textInput({ type: "text", placeholder: "@handle", value: details.tiktok, oninput: (e) => (details.tiktok = e.target.value) })),
        ]),
        el("div", { class: "flex justify-end pt-2" }, [button("Save Changes", { variant: "gold", type: "submit" })]),
      ]
    );

    const logoPreview = profile.logo
      ? el("div", { class: "mb-4" }, [
          profile.logo.fileType === "application/pdf"
            ? el(
                "a",
                {
                  href: profile.logo.dataUrl,
                  target: "_blank",
                  class: "flex items-center gap-3 max-w-xs rounded-lg border border-white/10 mb-2 bg-white/5 p-4 hover:border-gold/40 transition-colors",
                },
                [el("span", { class: "text-2xl" }, "📄"), el("span", { class: "text-sm text-gold-light underline underline-offset-2" }, "View PDF")]
              )
            : el("img", { src: profile.logo.dataUrl, class: "max-h-32 rounded-lg border border-white/10 mb-2 bg-white/5 p-2" }),
          el("div", { class: "text-xs text-ivory/35" }, profile.logo.fileName),
        ])
      : null;

    const logoSection = el("div", {}, [
      logoError,
      logoSuccess,
      logoPreview,
      el("input", {
        type: "file",
        accept: LOGO_ALLOWED_TYPES.join(","),
        class:
          "text-sm text-ivory/60 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-gold/15 file:text-gold-light file:text-xs file:font-medium hover:file:bg-gold/25 file:cursor-pointer cursor-pointer",
        onchange: (e) => {
          const file = e.target.files[0];
          if (!file) return;
          logoError.classList.add("hidden");
          if (!LOGO_ALLOWED_TYPES.includes(file.type)) {
            logoError.textContent = "Please upload a PNG, JPG, SVG, or PDF file.";
            logoError.classList.remove("hidden");
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            logoError.textContent = "Logo file must be under 5MB.";
            logoError.classList.remove("hidden");
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            justSavedLogo = true;
            updateCustomerProfile(email, {
              logo: { fileName: file.name, fileType: file.type, dataUrl: String(reader.result), uploadedAt: new Date().toISOString() },
            });
          };
          reader.readAsDataURL(file);
        },
      }),
    ]);

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

    const missingFields = getMissingProfileFields(email);
    const completionBanner = missingFields.length
      ? el("div", { class: "text-sm bg-gold/10 border-l-2 border-gold/50 rounded-r-lg px-4 py-3 mb-8" }, [
          el("div", { class: "font-medium text-gold-light mb-1" }, "Complete your profile to continue"),
          el(
            "div",
            { class: "text-ivory/60" },
            `You'll need to add: ${missingFields.join(", ")} before you can view inventory or schedule a pick.`
          ),
        ])
      : null;

    wrap.replaceChildren(
      ...[
        el("h1", { class: "font-serif text-4xl text-ivory mb-1" }, "My Account"),
        el("p", { class: "text-sm text-ivory/40 mb-8" }, "View and update your saved details."),
        completionBanner,
        card([el("div", { class: "p-8" }, [detailsError, detailsSuccess, detailsForm])], "mb-6"),
        card(
          [
            el("div", { class: "p-8" }, [
              el("h2", { class: "font-serif text-xl text-ivory mb-1" }, "Brand Logo"),
              el("p", { class: "text-sm text-ivory/40 mb-6" }, "This is the logo that goes on your bottle when a barrel is picked."),
              logoSection,
            ]),
          ],
          "mb-6"
        ),
        card([
          el("div", { class: "p-8" }, [
            el("h2", { class: "font-serif text-xl text-ivory mb-1" }, "Password"),
            el("p", { class: "text-sm text-ivory/40 mb-6" }, "Change the password you use to sign in."),
            passwordError,
            passwordSuccess,
            passwordFormNode,
          ]),
        ]),
      ].filter(Boolean)
    );
  }

  draw();
  return wrap;
}
