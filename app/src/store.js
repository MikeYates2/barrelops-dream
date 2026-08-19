// Simple localStorage-backed store with pub/sub. No framework, no build step.

const STORAGE_KEY = "barrelPickOps.v1";

const PHASES = [
  { n: 1, key: "intake", label: "Intake" },
  { n: 2, key: "method", label: "Choose Pick Method" },
  { n: 3, key: "samples", label: "Sample Fulfillment" },
  { n: 4, key: "label", label: "Label Creation" },
  { n: 5, key: "bottling", label: "Bottling" },
  { n: 6, key: "fulfillment", label: "Payment & Fulfillment" },
  { n: 7, key: "complete", label: "Complete" },
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
    customers: [], // saved profiles, keyed by lowercase email — see getCustomerProfile()
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
    if (!parsed.customers) parsed.customers = [];
    // Profiles created before the approval gate existed are grandfathered
    // in as approved — they were already active users of the app.
    parsed.customers.forEach((c) => {
      if (c.approvalStatus === undefined) c.approvalStatus = "approved";
    });
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

// A customer's saved profile — looked up by email so a returning customer
// doesn't have to retype their details on a later login or pick. Not a real
// account system (no password — see the STAFF_ACCESS_CODE note above for
// why this app doesn't attempt real auth): just persistence keyed by email.
export function getCustomerProfile(email) {
  if (!email) return null;
  return state.customers.find((c) => c.email === email.trim().toLowerCase()) || null;
}

// Merges non-empty fields into a customer's saved profile, creating it if
// this is the first time we've seen that email. Blank/undefined fields in
// `patch` are ignored so a partial update (e.g. login only knows name and
// group type) never clobbers details learned elsewhere (e.g. phone and
// location, only captured once a pick is submitted).
export function upsertCustomerProfile(patch) {
  if (!patch.email) return null;
  const email = patch.email.trim().toLowerCase();
  let profile = state.customers.find((c) => c.email === email);
  if (!profile) {
    profile = { email, createdAt: new Date().toISOString() };
    state.customers.push(profile);
  }
  Object.entries(patch).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") profile[key] = value;
  });
  profile.email = email;
  profile.updatedAt = new Date().toISOString();
  return profile;
}

// Creates a brand-new customer account. Fails if the email is already
// registered (they should sign in instead). New accounts start 'pending'
// and can't sign in until Dream Staff approves them — see approveCustomerProfile.
export function signUpCustomer({ name, email, password, groupType, retailerState }) {
  const normalizedEmail = (email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return { ok: false, error: "Email and password are required." };
  if (getCustomerProfile(normalizedEmail)) {
    return { ok: false, error: "An account with that email already exists. Please sign in instead." };
  }
  upsertCustomerProfile({
    name,
    email: normalizedEmail,
    password,
    groupType: groupType || "private_group",
    retailerState: groupType === "retailer" ? retailerState || null : null,
    approvalStatus: "pending",
  });
  notify();
  return { ok: true, pending: true };
}

// Signs an existing customer in by email + password. Distinct failure modes
// so the login screen can react appropriately: wrong/missing password,
// no password ever set (legacy or newly-approved account — needs setup),
// or a real account that's still awaiting staff approval.
export function loginAsCustomer({ email, password }) {
  const profile = getCustomerProfile(email);
  if (!profile) {
    return { ok: false, error: "No account found with that email. Please sign up." };
  }
  if (!profile.password) {
    return { ok: false, needsPasswordSetup: true };
  }
  if (profile.password !== password) {
    return { ok: false, error: "Incorrect password." };
  }
  if (profile.approvalStatus === "pending") {
    return { ok: false, pending: true, error: "Your account is awaiting approval from Dream Spirits staff. We'll be in touch once it's ready." };
  }
  state.currentRole = "customer";
  state.customerName = profile.name;
  state.currentCustomerEmail = profile.email;
  state.customerGroupType = profile.groupType;
  state.customerRetailerState = profile.groupType === "retailer" ? profile.retailerState || null : null;
  notify();
  return { ok: true };
}

// Sets or changes a customer's password — used both for a legacy/newly
// approved account's first-time setup and for the My Account change-password
// form. Not real security (see the STAFF_ACCESS_CODE note above): stored in
// plain text alongside the rest of the demo profile data.
export function setCustomerPassword(email, password) {
  const profile = getCustomerProfile(email);
  if (!profile) return { ok: false, error: "Account not found." };
  if (!password) return { ok: false, error: "Please enter a password." };
  profile.password = password;
  profile.updatedAt = new Date().toISOString();
  notify();
  return { ok: true };
}

export function pendingCustomerProfiles() {
  return state.customers.filter((c) => c.approvalStatus === "pending");
}

export function approveCustomerProfile(email) {
  const profile = getCustomerProfile(email);
  if (!profile) return;
  profile.approvalStatus = "approved";
  profile.updatedAt = new Date().toISOString();
  notify();
}

// Used by the My Account screen to edit a profile directly (name, address,
// customer status, licensing state). Unlike upsertCustomerProfile, this
// assigns every key in `patch` as-is (including explicit nulls/empty
// strings) so a deliberate edit — e.g. clearing an address field, or
// switching off Retailer and nulling out the licensing state — actually
// takes effect instead of being silently skipped.
export function updateCustomerProfile(email, patch) {
  const profile = getCustomerProfile(email);
  if (!profile) return null;
  Object.assign(profile, patch);
  profile.updatedAt = new Date().toISOString();
  if (state.currentCustomerEmail && state.currentCustomerEmail.toLowerCase() === profile.email) {
    if (patch.name !== undefined) state.customerName = patch.name;
    if (patch.groupType !== undefined) state.customerGroupType = patch.groupType;
    if (patch.retailerState !== undefined) state.customerRetailerState = patch.groupType === "retailer" ? patch.retailerState : null;
  }
  notify();
  return profile;
}

// Gates the barrel-less "Pick In Person" / "Pick Samples" entry points —
// both skip re-asking for contact details, so the profile has to already
// carry everything a pick would otherwise collect up front.
export function isCustomerProfileComplete(email) {
  const profile = getCustomerProfile(email);
  if (!profile) return false;
  const address = profile.address;
  const hasAddress = !!(address && address.street && address.city && address.state && address.zip);
  if (!profile.name || !profile.phone || !hasAddress) return false;
  if (profile.groupType === "retailer" && !profile.retailerState) return false;
  return true;
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
    sampleTracking: null, // tracking number for the sample shipment — set by staff
    finalSampleBarrelIds: [], // customer's final selection from the shipped samples
    finalSampleStatus: null, // null | 'submitted' | 'approved'
    requestedDates: [],
    approvedDate: null,
    dateStatus: null, // 'pending' | 'approved'
    houseRulesAcknowledged: false, // in-person only: $5,000 no-barrel-minimum policy
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
    p.phase = 3; // ship-samples path moves to Sample Fulfillment
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

export function acknowledgeHouseRules(id) {
  const p = getPick(id);
  if (!p) return;
  p.houseRulesAcknowledged = true;
  notify();
}

// A customer's saved brand logo is the one that goes on the bottle — once a
// pick reaches Label Creation, apply it automatically instead of asking them
// to upload the same file again. Never overwrites a logo the pick already
// has (e.g. after going back and forward again through this phase).
function applyProfileLogoIfAvailable(pick) {
  if (pick.logo) return;
  const profile = getCustomerProfile(pick.contact.email);
  if (profile && profile.logo) {
    pick.logo = profile.logo;
  }
}

export function approveDate(id, date) {
  const p = getPick(id);
  if (!p) return;
  p.approvedDate = date;
  p.dateStatus = "approved";
  p.phase = 4; // in-person visits skip Sample Fulfillment, straight to Label Creation
  applyProfileLogoIfAvailable(p);
  notify();
}

export function setSampleTracking(id, trackingNumber) {
  const p = getPick(id);
  if (!p) return;
  p.sampleTracking = trackingNumber;
  notify();
}

export function submitFinalSampleSelections(id, barrelIds) {
  const p = getPick(id);
  if (!p) return;
  p.finalSampleBarrelIds = barrelIds;
  p.finalSampleStatus = "submitted";
  notify();
}

export function approveFinalSampleSelections(id) {
  const p = getPick(id);
  if (!p) return;
  p.finalSampleStatus = "approved";
  notify();
}

export function advanceToLabelCreation(id) {
  const p = getPick(id);
  if (!p) return;
  p.phase = 4;
  applyProfileLogoIfAvailable(p);
  notify();
}

export function uploadLogo(id, logo) {
  const p = getPick(id);
  if (!p) return;
  p.logo = logo; // { fileName, dataUrl, uploadedAt }
  if (p.phase < 5) p.phase = 5; // Bottling
  notify();
}

export function advanceToBottling(id) {
  const p = getPick(id);
  if (!p) return;
  if (p.phase < 5) p.phase = 5;
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
  p.phase = 6;
  notify();
}

export function markListingComplete(id) {
  const p = getPick(id);
  if (!p) return;
  p.fulfillment.listingComplete = true;
  p.phase = 7;
  const barrel = getBarrel(p.barrelId);
  if (barrel) barrel.status = "sold";
  notify();
}

// The earliest phase a pick can be sent back to — Sample Fulfillment doesn't
// exist for in-person visits, and Intake has no editable screen in the pick
// detail view, so each path's own starting phase is the floor.
export function minPickPhase(pick) {
  return pick.pickMethod === "2A_ship_samples" ? 3 : 2;
}

export function goToPreviousPhase(id) {
  const p = getPick(id);
  if (!p) return;
  if (p.phase <= minPickPhase(p)) return;
  if (p.phase === 4 && p.pickMethod === "2B_in_person") {
    // Sample Fulfillment doesn't apply here — reopen date approval instead.
    p.phase = 2;
    p.dateStatus = "pending";
  } else if (p.phase === 7) {
    p.phase = 6;
    p.fulfillment.listingComplete = false;
    const barrel = getBarrel(p.barrelId);
    if (barrel) barrel.status = "in_bottling";
  } else {
    p.phase -= 1;
  }
  notify();
}

export function picksForCustomer(email) {
  if (!email) return [];
  return state.picks.filter((p) => p.contact.email.toLowerCase() === email.toLowerCase());
}

// Cancels a pick entirely (removed from both the staff dashboard and the
// customer's My Picks) and frees its barrel back up for a new pick.
export function returnPickToInventory(id) {
  const p = getPick(id);
  if (!p) return;
  const barrel = getBarrel(p.barrelId);
  if (barrel) barrel.status = "available";
  state.picks = state.picks.filter((x) => x.id !== id);
  notify();
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
