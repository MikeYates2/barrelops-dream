// Simple localStorage-backed store with pub/sub. No framework, no build step.

const STORAGE_KEY = "barrelPickOps.v1";

const PHASES = [
  { n: 1, key: "intake", label: "Intake" },
  { n: 2, key: "method", label: "Choose Pick Method" },
  { n: 3, key: "label", label: "Label Creation" },
  { n: 4, key: "bottling", label: "Bottling" },
  { n: 5, key: "fulfillment", label: "Payment & Fulfillment" },
  { n: 6, key: "complete", label: "Complete" },
];

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// States Dream Spirits currently distributes to. Retailers (whether at
// login or on a specific pick) must hold a license in one of these.
const RETAILER_STATES = [
  { value: "CA", label: "California (CA)" },
  { value: "CT", label: "Connecticut (CT)" },
  { value: "FL", label: "Florida (FL)" },
  { value: "GA", label: "Georgia (GA)" },
  { value: "ID", label: "Idaho (ID)" },
  { value: "MD", label: "Maryland (MD)" },
  { value: "NV", label: "Nevada (NV)" },
  { value: "NJ", label: "New Jersey (NJ)" },
  { value: "NY", label: "New York (NY)" },
  { value: "SC", label: "South Carolina (SC)" },
  { value: "TX", label: "Texas (TX)" },
  { value: "VA", label: "Virginia (VA)" },
  { value: "DC", label: "Washington D.C. (DC)" },
  { value: "WV", label: "West Virginia (WV)" },
];

// Seeded from the real Dream Spirits master price list. Pricing here is
// per bottle (retail MSRP and private-group price), not per barrel — each
// row is a single barrel's SKU, matching the CSV upload template below.
function seedBarrels() {
  const rows = [
    { sku: "Bardstown Bourbon Company Bourbon", distilledWhen: "Dec 2018", retailMsrp: 89.99, privateGroupPricing: 71.0, notes: "", status: "available" },
    { sku: "Bardstown Bourbon Co Wheated Bourbon", distilledWhen: "Oct 2017", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "Barton 19 year bourbon", distilledWhen: "Apr 2007", retailMsrp: null, privateGroupPricing: 599.0, notes: "Not available for retailers or restaurants. Private Group or 1 West Dupont ONLY.", status: "available" },
    { sku: "Barton 19 year old bourbon, HAZMAT super short barrels", distilledWhen: "Spring 2007", retailMsrp: null, privateGroupPricing: 599.0, notes: "Not available for retailers or restaurants. Private Group or 1 West Dupont ONLY.", status: "available" },
    { sku: "Barton 10 year bourbon", distilledWhen: "Jun 2016", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "Barton 12 year old HAZMAT", distilledWhen: "May 2014", retailMsrp: null, privateGroupPricing: null, notes: "These are hazmat and reserved for 1 West Dupont ONLY.", status: "not_available" },
    { sku: "Bookers Bourbon mashbill from Jim Beam", distilledWhen: "Sep 2014", retailMsrp: 129.99, privateGroupPricing: 111.0, notes: "", status: "available" },
    { sku: "Bookers Bourbon mashbill from Jim Beam DO Kelvin", distilledWhen: "Sep 2014", retailMsrp: 139.99, privateGroupPricing: 121.0, notes: "", status: "available" },
    { sku: "Cascade Hollow (Dickel) Bourbon", distilledWhen: "Jun 2005", retailMsrp: 199.99, privateGroupPricing: 171.0, notes: "", status: "available" },
    { sku: "Buff Trace Mashbill 2", distilledWhen: "Apr 2015", retailMsrp: 179.99, privateGroupPricing: 151.0, notes: "NOT AVAILABLE UNLESS you have done 6+ barrels with Dream Spirits. 1 per 6", status: "available" },
    { sku: "Buff Trace Mashbill 2 Double Oaked in New Kelvin", distilledWhen: "2015", retailMsrp: 199.99, privateGroupPricing: 161.0, notes: "NOT AVAILABLE UNLESS you have done 6+ barrels with Dream Spirits. 1 per 6", status: "available" },
    { sku: "DC distilled Apple Brandy", distilledWhen: "Mar 2018", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "DC Distilled Apple Brandy", distilledWhen: "Mar 2017", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "DC Distilled High Rye Bourbon", distilledWhen: "feb - april 2015", retailMsrp: 149.99, privateGroupPricing: 121.0, notes: "all DC Distilled is distilled by defunct One Eight Distilling", status: "available" },
    { sku: "DC Distilled HIgh Rye Bourbon", distilledWhen: "june - nov 2015", retailMsrp: 149.99, privateGroupPricing: 121.0, notes: "", status: "available" },
    { sku: "DC Distilled Wheated Bourbon", distilledWhen: "Jan 2018", retailMsrp: 149.99, privateGroupPricing: 121.0, notes: "", status: "available" },
    { sku: "DC Distilled Wheated Bourbon", distilledWhen: "Mar 2017", retailMsrp: 159.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "Heaven Hill 8 year Double Oaked in New Kelvin", distilledWhen: "fall 2017", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "Heaven Hill 9 year Double Oaked in New Kelvin; toasted", distilledWhen: "", retailMsrp: 129.99, privateGroupPricing: 111.0, notes: "", status: "available" },
    { sku: "Heaven Hill 13 year", distilledWhen: "Feb 2013", retailMsrp: null, privateGroupPricing: null, notes: "These are hazmat and reserved for 1 West Dupont ONLY.", status: "not_available" },
    { sku: "Kentucky Artisan Distillery Bourbon (High Rye)", distilledWhen: "Mar 2017", retailMsrp: 99.99, privateGroupPricing: 81.0, notes: "", status: "available" },
    { sku: "Kentucky Artisan Distillery Bourbon (High Rye)", distilledWhen: "jan - april 2015", retailMsrp: 129.99, privateGroupPricing: 111.0, notes: "", status: "available" },
    { sku: "Kentucky Artisan Distillery Rye", distilledWhen: "Sep 2016", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "Kentucky Bourbon NDA FOR DISTILLERY HIGH PROOF/HAZMAT", distilledWhen: "Sep 2014", retailMsrp: 149.99, privateGroupPricing: 131.0, notes: "Most of these are HAZMAT", status: "available" },
    { sku: "MGP Alchemy Bourbon", distilledWhen: "Mar 2013", retailMsrp: 149.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "MGP Alchemy Bourbon", distilledWhen: "Sep 2015", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "MGP Alchemy Bourbon Double Oaked In New Kelvin", distilledWhen: "Mar 2013", retailMsrp: 159.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "MGP High Rye Bourbon (36% rye mashbill)", distilledWhen: "May 2013", retailMsrp: 149.99, privateGroupPricing: 121.0, notes: "", status: "available" },
    { sku: "MGP High Rye Bourbon (36% rye mashbill)", distilledWhen: "Nov 2016", retailMsrp: 99.99, privateGroupPricing: 81.0, notes: "", status: "available" },
    { sku: "MGP High Rye Bourbon (36% rye mashbill)", distilledWhen: "2016", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "MGP Light Whiskey", distilledWhen: "May 2008", retailMsrp: 129.99, privateGroupPricing: 111.0, notes: "Off Profile; Low Proof ALW", status: "available" },
    { sku: "MGP Light Whiskey Double Oaked In New Kelvin", distilledWhen: "May 2008", retailMsrp: 139.99, privateGroupPricing: 121.0, notes: "Off Profile; Low Proof ALW", status: "available" },
    { sku: "MGP Light Whiskey", distilledWhen: "Dec 2005", retailMsrp: 159.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "MGP Light Whiskey Double Oaked In New Kelvin", distilledWhen: "Apr 2005", retailMsrp: 169.99, privateGroupPricing: 141.0, notes: "", status: "available" },
    { sku: "MGP Low Rye Bourbon (21% rye mashbill)", distilledWhen: "Sept - October 2015", retailMsrp: 99.99, privateGroupPricing: 81.0, notes: "", status: "available" },
    { sku: "MGP Low Rye Bourbon (21% rye mashbill) DO Kelvin", distilledWhen: "2015", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "MGP Low Rye Bourbon (21% rye mashbill)", distilledWhen: "Jul 2018", retailMsrp: 79.99, privateGroupPricing: 61.0, notes: "INSANE VALUE!!", status: "available" },
    { sku: "MGP Rye (51 rye/49 barley)", distilledWhen: "2015", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "MGP Rye (51 rye/49 barley)", distilledWhen: "2016", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "MGP Rye (95 rye/5 barley)", distilledWhen: "2015", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "MGP Rye (95 rye/5 barley)", distilledWhen: "2016", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "", status: "available" },
    { sku: "MGP Rye (95 rye/5 barley)", distilledWhen: "Apr 2011", retailMsrp: null, privateGroupPricing: null, notes: "Not Available. On reserve for 1 West Dupont only", status: "not_available" },
    { sku: "MGP Rye (95 rye/5 barley)", distilledWhen: "Feb 2013", retailMsrp: 159.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "MGP Rye (95 rye/5 barley)", distilledWhen: "2016", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "MGP Wheated Bourbon (45% wheat mashbill)", distilledWhen: "Dec 2016", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "", status: "available" },
    { sku: "Wild Turkey Russells Reserve Bourbon", distilledWhen: "Dec 2015", retailMsrp: 149.99, privateGroupPricing: 131.0, notes: "", status: "available" },
    { sku: "Wild Turkey Rusells Double Oaked in New Kelvin", distilledWhen: "Dec 2015", retailMsrp: 159.99, privateGroupPricing: 141.0, notes: "", status: "available" },
    { sku: "Willett Rye In Port Barrels", distilledWhen: "Jun 2017", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "Put in port barrels july 2019", status: "available" },
    { sku: "Willett Wheated Bourbon in French Oak then Chadonnay Barrels", distilledWhen: "May 2017", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "Put in FO december 2019. Then chard nov 2022", status: "available" },
    { sku: "Willett Wheated Bourbon In FO then Chard then New Kelvin Barrel", distilledWhen: "May 2017", retailMsrp: 119.99, privateGroupPricing: 101.0, notes: "Transferred to new Kelvin barrels in February 2026", status: "available" },
    { sku: "Willett Bourbon Aged In Cabernet Barrels", distilledWhen: "May 2017", retailMsrp: 109.99, privateGroupPricing: 91.0, notes: "72corn/13rye/15barley mashbill. Put into cab nov 2022", status: "available" },
    { sku: "Woody Creek Rye Hazmat Proof", distilledWhen: "Apr 2015", retailMsrp: 149.99, privateGroupPricing: 131.0, notes: "HAZMAT", status: "available" },
  ];
  return rows.map((r) => ({ id: uid("brl"), dateAdded: new Date().toISOString(), ...r }));
}

function seedState() {
  return {
    currentRole: null, // 'staff' | 'customer' | null (logged out)
    currentCustomerEmail: null,
    customerName: null,
    customerGroupType: null, // 'private_group' | 'retailer' — set at customer login
    customerRetailerState: null,
    staffName: null,
    barrels: seedBarrels(),
    picks: [],
    membershipRequests: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed.barrels || !parsed.picks) return seedState();
    if (!parsed.membershipRequests) parsed.membershipRequests = [];
    if (parsed.customerName === undefined) parsed.customerName = null;
    if (parsed.staffName === undefined) parsed.staffName = null;
    if (parsed.customerGroupType === undefined) parsed.customerGroupType = null;
    if (parsed.customerRetailerState === undefined) parsed.customerRetailerState = null;
    return parsed;
  } catch (e) {
    console.warn("Failed to load state, reseeding", e);
    return seedState();
  }
}

let state = load();
const subscribers = new Set();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify() {
  persist();
  subscribers.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function getState() {
  return state;
}

export function resetDemoData() {
  state = seedState();
  notify();
}

// ---- Auth / session ----
//
// This is a client-side-only demo gate, not real security — anyone reading
// the source (or this file) can see STAFF_ACCESS_CODE. It's here to stop
// customers from casually landing on the staff dashboard, not to withstand
// a determined attacker. Real staff auth needs a backend.
const STAFF_ACCESS_CODE = "DREAMSTAFF";

export function loginAsCustomer({ name, email, groupType, retailerState }) {
  state.currentRole = "customer";
  state.customerName = name;
  state.currentCustomerEmail = email;
  state.customerGroupType = groupType || "private_group";
  state.customerRetailerState = groupType === "retailer" ? retailerState || null : null;
  notify();
  return { ok: true };
}

export function loginAsStaff({ name, accessCode }) {
  if ((accessCode || "").trim().toUpperCase() !== STAFF_ACCESS_CODE) {
    return { ok: false, error: "Incorrect access code." };
  }
  state.currentRole = "staff";
  state.staffName = name;
  notify();
  return { ok: true };
}

export function logout() {
  state.currentRole = null;
  state.staffName = null;
  state.customerName = null;
  state.currentCustomerEmail = null;
  state.customerGroupType = null;
  state.customerRetailerState = null;
  notify();
}

export function setCustomerEmail(email) {
  state.currentCustomerEmail = email;
  notify();
}

// ---- Barrel inventory (Dream Spirits staff) ----

export function addBarrel(barrel) {
  state.barrels.push({
    id: uid("brl"),
    status: "available",
    dateAdded: new Date().toISOString(),
    ...barrel,
  });
  notify();
}

export function bulkAddBarrels(barrels) {
  const now = new Date().toISOString();
  barrels.forEach((b) => {
    state.barrels.push({ id: uid("brl"), status: "available", dateAdded: now, ...b });
  });
  notify();
}

export function updateBarrel(id, patch) {
  const b = state.barrels.find((x) => x.id === id);
  if (!b) return;
  Object.assign(b, patch);
  notify();
}

export function getBarrel(id) {
  return state.barrels.find((b) => b.id === id);
}

// ---- Barrel picks (the customer journey) ----

export function createPick({ barrelId, contact }) {
  const pick = {
    id: uid("pick"),
    barrelId,
    createdAt: new Date().toISOString(),
    contact, // { name, email, phone, location, groupType }
    pickMethod: null, // '2A_ship_samples' | '2B_in_person'
    shippingAddress: null, // { street, city, state, zip } — set when shipping samples
    sampleBarrelIds: [], // barrel ids to pull samples from — set when shipping samples
    requestedDates: [],
    approvedDate: null,
    dateStatus: null, // 'pending' | 'approved'
    phase: 1,
    logo: null,
    bottling: { status: "not_started", bottleCount: null, notes: "", updatedAt: null },
    fulfillment: { listingComplete: false, notes: "" },
  };
  state.picks.push(pick);
  notify();
  return pick;
}

export function getPick(id) {
  return state.picks.find((p) => p.id === id);
}

export function updatePick(id, patch) {
  const p = state.picks.find((x) => x.id === id);
  if (!p) return;
  Object.assign(p, patch);
  notify();
}

export function setPickMethod(id, method) {
  const p = getPick(id);
  if (!p) return;
  p.pickMethod = method;
  if (method === "2B_in_person") {
    p.dateStatus = "pending";
    p.phase = 2; // stays at phase 2 until staff approves a date
  } else {
    p.dateStatus = null;
    p.phase = 3; // ship-samples path moves straight to label creation
  }
  notify();
}

export function setShippingAddress(id, address) {
  const p = getPick(id);
  if (!p) return;
  p.shippingAddress = address;
  notify();
}

export function setSampleSelections(id, barrelIds) {
  const p = getPick(id);
  if (!p) return;
  p.sampleBarrelIds = barrelIds;
  notify();
}

export function requestDates(id, dates) {
  const p = getPick(id);
  if (!p) return;
  p.requestedDates = dates;
  p.dateStatus = "pending";
  notify();
}

export function approveDate(id, date) {
  const p = getPick(id);
  if (!p) return;
  p.approvedDate = date;
  p.dateStatus = "approved";
  p.phase = 3;
  notify();
}

export function uploadLogo(id, logo) {
  const p = getPick(id);
  if (!p) return;
  p.logo = logo; // { fileName, dataUrl, uploadedAt }
  if (p.phase < 4) p.phase = 4;
  notify();
}

export function updateBottling(id, patch) {
  const p = getPick(id);
  if (!p) return;
  p.bottling = { ...p.bottling, ...patch, updatedAt: new Date().toISOString() };
  const barrel = getBarrel(p.barrelId);
  if (barrel) barrel.status = "in_bottling";
  notify();
}

export function advanceToFulfillment(id) {
  const p = getPick(id);
  if (!p) return;
  p.phase = 5;
  notify();
}

export function markListingComplete(id) {
  const p = getPick(id);
  if (!p) return;
  p.fulfillment.listingComplete = true;
  p.phase = 6;
  const barrel = getBarrel(p.barrelId);
  if (barrel) barrel.status = "sold";
  notify();
}

export function picksForCustomer(email) {
  if (!email) return [];
  return state.picks.filter((p) => p.contact.email.toLowerCase() === email.toLowerCase());
}

// ---- Membership CTA capture (demo — stored locally, visible to staff) ----

// Deliberately calls persist(), not notify(): the membership panel swaps to
// a confirmation state entirely with its own local redraw. Broadcasting to
// the global re-render subscriber would remount the whole Marketplace page
// (main.js re-renders the current route on every store change) and wipe
// that local "submitted" flag before the user ever sees the confirmation.
export function requestMembership({ name, email }) {
  state.membershipRequests.push({
    id: uid("mbr"),
    name,
    email,
    requestedAt: new Date().toISOString(),
  });
  persist();
}

export { PHASES, RETAILER_STATES, uid };
