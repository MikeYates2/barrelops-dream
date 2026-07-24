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

function seedBarrels() {
  const rows = [
    ["Rye Whiskey", 10.3, "MGPI of Indiana", "MGPI - Lawrenceburg", "0/95/5", 100, 1957, true],
    ["Rye Whiskey", 10.3, "MGPI of Indiana", "MGPI - Lawrenceburg", "0/95/5", 100, 1957, true],
    ["Rye Whiskey", 10.6, "MGPI of Indiana", "MGPI - Lawrenceburg", "0/95/5", 100, 1983, true],
    ["Bourbon Whiskey", 7.5, "Green River", "Green River - Owensboro", "70/21/9", 14, 1250, false],
    ["Bourbon Whiskey", 11.9, "MGPI of Indiana", "MGPI - Lawrenceburg", "60/36/4", 25, 2987, true],
    ["Bourbon Whiskey", 11.9, "MGPI of Indiana", "MGPI - Lawrenceburg", "60/36/4", 13, 2936, true],
    ["Rye Whiskey", 9.7, "MGPI of Indiana", "Eight Settlers", "0/95/5", 14, 2009, false],
    ["Bourbon Whiskey", 8.7, "MGPI of Indiana", "Eight Settlers", "60/36/4", 12, 2163, false],
    ["Single Malt Whiskey", 4.2, "Restless Spirits Distilling", "Restless Spirits", "0/0/100", 1, 3348, true],
    ["Single Malt Whiskey", 4.5, "Restless Spirits Distilling", "Restless Spirits", "0/0/100", 2, 3348, true],
  ];
  return rows.map(
    ([whiskeyType, ageYears, distiller, warehouser, mashBill, numBarrels, pricePerBarrel, samplesAvailable]) => ({
      id: uid("brl"),
      whiskeyType,
      ageYears,
      distiller,
      warehouser,
      mashBill,
      numBarrels,
      pricePerBarrel,
      status: "available", // available | in_bottling | not_available | sold
      samplesAvailable,
      dateAdded: new Date().toISOString(),
    })
  );
}

function seedState() {
  return {
    currentRole: "customer", // 'staff' | 'customer'
    currentCustomerEmail: null,
    barrels: seedBarrels(),
    picks: [],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);
    if (!parsed.barrels || !parsed.picks) return seedState();
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

// ---- Role / session ----

export function setRole(role) {
  state.currentRole = role;
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

export { PHASES, uid };
