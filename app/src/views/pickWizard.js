import {
  createPick,
  setPickMethod,
  requestDates,
  setShippingAddress,
  setSampleSelections,
  acknowledgeHouseRules,
  getState,
  getCustomerProfile,
  upsertCustomerProfile,
  isValidZip,
} from "../store.js";
import { el, card, button, field, textInput, fmtStayWindow } from "../ui.js";
import { renderCalendar } from "../components/calendar.js";
import { renderSampleSelector } from "../components/sampleSelector.js";
import { navigate } from "../router.js";

// Both entry points (the sidebar's "Pick In Person" / "Pick Samples") are
// gated on a complete profile before the customer ever gets here — see
// main.js's startPick() — so contact info is read straight from the saved
// account instead of being collected again.
export function renderPickWizard({ method }) {
  const state = getState();
  const profile = getCustomerProfile(state.currentCustomerEmail) || {};

  const contact = {
    name: profile.name || "",
    email: state.currentCustomerEmail || "",
    phone: profile.phone || "",
    location: profile.address ? `${profile.address.city}, ${profile.address.state}` : "",
    groupType: profile.groupType || "private_group",
    retailerState: profile.retailerState || "",
  };

  const selectedDates = new Set();
  let houseRulesAcknowledged = false;
  // A copy, not a reference — editing the shipping address for this one
  // shipment shouldn't touch the saved profile until submit.
  const shipping = { street: "", city: "", state: "", zip: "", ...profile.address };
  // Nothing is "locked" here — unlike the old per-barrel flow, this pick
  // isn't anchored to a barrel the customer already committed to.
  const sampleBarrelIds = new Set();
  const errorBox = el("div", { class: "hidden text-sm text-ivory bg-white/[0.06] border-l-2 border-white/60 rounded-r-lg px-4 py-2.5 mb-4" });

  const wrap = el("div", { class: "px-4 py-8 sm:px-8 sm:py-16 max-w-2xl mx-auto" });

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function submitPick() {
    if (method === "2B_in_person" && selectedDates.size === 0) {
      showError("Please select at least one preferred date.");
      return;
    }
    if (method === "2B_in_person" && !houseRulesAcknowledged) {
      showError("Please acknowledge the barrel minimum policy to continue.");
      return;
    }
    if (method === "2A_ship_samples" && sampleBarrelIds.size === 0) {
      showError("Please select at least one barrel to sample.");
      return;
    }
    if (method === "2A_ship_samples" && (!shipping.street.trim() || !shipping.city.trim() || !shipping.state.trim() || !shipping.zip.trim())) {
      showError("Please fill in your full shipping address.");
      return;
    }
    if (method === "2A_ship_samples" && !isValidZip(shipping.zip)) {
      showError("Please enter a valid ZIP code, e.g. 40202 or 40202-1234.");
      return;
    }
    errorBox.classList.add("hidden");

    // No single barrel starts this pick anymore — for ship-samples, the up-
    // to-5 selection below is the pick's actual subject matter.
    const pick = createPick({ barrelId: null, contact });
    setPickMethod(pick.id, method);
    if (method === "2B_in_person") {
      requestDates(pick.id, Array.from(selectedDates));
      acknowledgeHouseRules(pick.id);
    }
    if (method === "2A_ship_samples") {
      const address = { street: shipping.street.trim(), city: shipping.city.trim(), state: shipping.state.trim(), zip: shipping.zip.trim() };
      setShippingAddress(pick.id, address);
      setSampleSelections(pick.id, Array.from(sampleBarrelIds));
      upsertCustomerProfile({ email: contact.email, address });
    }
    navigate(`/pick/${pick.id}`);
  }

  function inPersonView() {
    const stayWindowSummary = el("ul", { class: "mt-4 space-y-1" });
    function refreshStayWindowSummary() {
      stayWindowSummary.replaceChildren(
        ...Array.from(selectedDates).map((iso) => el("li", { class: "text-sm text-ivory/60" }, fmtStayWindow(iso)))
      );
    }
    refreshStayWindowSummary();

    const dateLimitNote = el("p", { class: "hidden text-xs text-gold-light mt-3" }, "You can choose up to 3 arrival dates. Deselect one to pick a different date.");

    return card([
      el("div", { class: "p-5 sm:p-8" }, [
        el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Select your arrival date(s)"),
        el(
          "p",
          { class: "text-xs text-ivory/35 mb-4" },
          "Each visit is a 2-night stay. Pick up to 3 arrival dates and Dream Spirits staff will confirm one."
        ),
        renderCalendar({
          selected: selectedDates,
          onToggle: (iso) => {
            dateLimitNote.classList.add("hidden");
            if (selectedDates.has(iso)) selectedDates.delete(iso);
            else if (selectedDates.size < 3) selectedDates.add(iso);
            else dateLimitNote.classList.remove("hidden");
            refreshStayWindowSummary();
          },
        }),
        dateLimitNote,
        stayWindowSummary,
        el("div", { class: "mt-6 pt-6 border-t border-white/10" }, [
          el("label", { class: "flex items-start gap-3 cursor-pointer" }, [
            el("input", {
              type: "checkbox",
              checked: houseRulesAcknowledged,
              class: "mt-0.5 w-4 h-4 rounded border-white/30 bg-white/[0.04] accent-gold-light shrink-0",
              onchange: (e) => (houseRulesAcknowledged = e.target.checked),
            }),
            el(
              "span",
              { class: "text-sm text-ivory/60 leading-relaxed" },
              "I understand that by staying at the Dream Spirits property, I will be required to select a minimum of 1 barrel per visit otherwise, I will owe $5,000 for the trip."
            ),
          ]),
        ]),
        el("div", { class: "flex justify-end pt-8" }, [button("Submit Pick Request", { variant: "gold", onClick: submitPick })]),
      ]),
    ]);
  }

  function samplesView() {
    return card([
      el("div", { class: "p-5 sm:p-8" }, [
        el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Select Your Samples"),
        el("p", { class: "text-xs text-ivory/35 mb-4" }, "Choose up to 5 offerings to include in this shipment."),
        renderSampleSelector({ barrels: state.barrels, selected: sampleBarrelIds }),
        el("div", { class: "mt-6 pt-6 border-t border-white/10" }, [
          el("span", { class: "block text-[11px] font-medium text-gold-light/80 uppercase tracking-widest mb-2" }, "Shipping Address"),
          el("p", { class: "text-xs text-ivory/35 mb-4" }, "Where should we send your samples?"),
          el("div", { class: "grid grid-cols-1 sm:grid-cols-2 gap-5" }, [
            el(
              "div",
              { class: "sm:col-span-2" },
              field("Street Address", textInput({ type: "text", value: shipping.street, oninput: (e) => (shipping.street = e.target.value) }))
            ),
            field("City", textInput({ type: "text", value: shipping.city, oninput: (e) => (shipping.city = e.target.value) })),
            field("State", textInput({ type: "text", placeholder: "e.g. KY", value: shipping.state, oninput: (e) => (shipping.state = e.target.value) })),
            field("ZIP Code", textInput({ type: "text", value: shipping.zip, oninput: (e) => (shipping.zip = e.target.value) })),
          ]),
        ]),
        el("div", { class: "flex justify-end pt-8" }, [button("Submit Pick Request", { variant: "gold", onClick: submitPick })]),
      ]),
    ]);
  }

  wrap.replaceChildren(
    el("a", { href: "#/", class: "text-xs text-gold/70 hover:text-gold transition-colors" }, "← Back to Inventory"),
    el("h1", { class: "font-serif text-4xl text-ivory mt-3 mb-1" }, method === "2B_in_person" ? "Schedule Your Visit" : "Select Your Samples"),
    el(
      "p",
      { class: "text-sm text-ivory/40 mb-8" },
      method === "2B_in_person" ? "Choose a 2-night stay window at the Dream Spirits property." : "Choose up to 5 barrels to sample, and where to ship them."
    ),
    errorBox,
    method === "2B_in_person" ? inPersonView() : samplesView()
  );

  return wrap;
}
