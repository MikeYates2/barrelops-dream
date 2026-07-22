# Barrel Pick Ops Platform — Master PRD (v0.2)

**Status**: This is the multi-phase vision doc. Phase 1 build execution now lives in [phase-1-spec.md](phase-1-spec.md) — that's the authoritative spec for what's being built first; this doc covers the full pipeline and Phase 2/3 scope it grows into.

**Confirmed decisions**:
- **Stack**: custom-coded (React/Node or Flask + Postgres + S3), not Airtable — the platform's core requirement is strict per-account access control across two external audiences (customers, distributors), which Airtable's collaboration model isn't built for.
- **Phase 1 scope**: samples-by-mail flow only. House-visit tasting, automated label generation, and automated email/SMS notifications are deferred to Phase 2 (moved out of this doc's P0 list accordingly).
- **Auth (Phase 1)**: simple email/password, no SSO.

## Problem Statement

The barrel-selection process today — from first outreach through sample shipping or house visits, label design, bottling, invoicing, payment, and freight — runs across phone calls, texts, spreadsheets, and manual handoffs between the brand, the customer (private group or retailer), and (for retail sales) a distributor. No one party can see where a given pick stands without asking someone else, and each handoff (samples pulled, label ordered, bottling count logged, invoice paid, BOL issued) depends on a person remembering to notify the next person. As order volume grows, this does not scale and picks will start falling through cracks.

## Goals

1. Any of the three parties (brand, customer, distributor) can check pick status without contacting anyone else — target: eliminate "what's the status of my barrel" as an inbound question.
2. Every handoff in the pipeline (sample request → label → bottling → invoice → payment → freight) triggers an automatic notification to the next responsible party instead of relying on memory.
3. The brand can pull a profitability view (revenue, COGS, margin) per barrel/pick without reassembling data from invoices and vendor bills by hand.
4. Returning private-group and retailer customers can see their own full history (visits, purchases, bottle counts, price paid) without asking the brand to look it up.
5. Reduce the brand's/COO's manual coordination work on a single pick — target established after Phase 1 baseline (not measurable pre-launch).

## Non-Goals (v1)

- **E-commerce/merch storefront** — real but separable problem; do later once the core pipeline is proven. (Phase 2+)
- **LTO/release drop ordering** — different audience (broadcast to full customer list, not a tracked pipeline) and different urgency model (first-come-first-served at a moment in time). (Phase 2+)
- **Native mobile app** — a responsive web app / Airtable interface is sufficient; no app-store distribution in v1.
- **Direct payment processing (moving money)** — the platform tracks and confirms payment status; it does not execute wire transfers, charge cards, or move funds itself. Wires, checks, and any online payment stay in the customer's/distributor's own banking or payment tools.
- **Full QuickBooks sync (two-way accounting)** — v1 tracks invoice/payment status in-platform; whether/how deeply this talks to QuickBooks is an open question, not a v1 commitment.

## Roles & What Each Can See/Do

### Brand (owner + COO)
- Full visibility into every pick, across every customer and distributor, at every stage.
- Loads/maintains barrel inventory, sets pricing (private group vs. retailer), confirms house-visit dates, marks payments received, manages the state→distributor mapping.
- Sees cross-pick reporting: sales, COGS, profitability, outstanding invoices, samples in flight.
- Receives every "action needed" notification (sample pull request, logo uploaded → label needed, bottling count needed, payment proof uploaded, etc.).

### Customer — Private Group
- Submits intake form once; sees their own pick(s) status only.
- Chooses samples-by-mail or house visit; picks preferred house-visit dates from open calendar slots.
- Selects barrel(s) after tasting, uploads logo, views invoice + wiring instructions, uploads wire confirmation, views BOL and tracks freight.
- Sees full history across past visits: what they bought, when, bottle counts, price paid, and (if the brand adds them) photos.

### Customer — Retailer
- Same intake/tasting/selection flow as a private group, tagged with their state.
- Does **not** see invoicing/payment directly — that leg goes to their assigned distributor. Retailer sees pick status but payment/freight status is the distributor's view, not theirs (open question: does retailer need any payment visibility, or is that distributor-only?).

### Distributor
- Sees only the retailers/picks mapped to them.
- Sees invoices addressed to them, arranges pickup, marks paid (or pays online if that path is built), sees terms and payment history.
- Does not see other distributors' accounts, brand-side COGS, or private-group data.

## Core Entities (data model sketch)

- **Contact/Account** — name, phone, email, shipping address, type (private group / retailer), state (if retailer), linked Distributor (derived from state).
- **Distributor** — name, contact info, states served.
- **Barrel/Inventory** — barrel number, distillery, mash bill/type, age, proof, status (available, sampled, sold, bottled).
- **Pick Event** — one customer's journey through the pipeline; links Contact → tasting method → selected Barrel(s) → current stage. This is the state-machine object described below.
- **Sample Shipment** — barrels sampled, ship-to address, carrier, tracking number, label file, status.
- **House Visit Booking** — proposed dates, confirmed date, calendar block, waiver signed (Y/N), access-info-sent (Y/N).
- **Label Job** — barrel details + logo file → designer → status → Google Drive file link → sent-to-printer batch/date.
- **Bottling Run** — barrel number, bottle count, date.
- **Invoice** — Pick Event, customer type (drives price), amount, status (sent/paid), payment proof (wire screenshot or check ref).
- **Freight/BOL** — carrier, delivery address, residential/commercial, dock-required, BOL file, tracking status.

## Pipeline State Machine (per Pick Event)

```
Intake → Tasting Method Chosen
   ├─ Samples: Samples Requested → Shipped → Delivered
   └─ House Visit: Dates Proposed → Confirmed → Reminder Sent → Visited
→ Barrel(s) Selected (+ logo uploaded)
→ Label Requested → Label Delivered → Sent to Printer
→ Bottled (count logged)
→ Invoiced
   ├─ Private Group: Wire Instructions Sent → Payment Proof Uploaded → Payment Confirmed
   └─ Retailer: Sent to Distributor → Pickup Arranged → Paid (online or check)
→ Freight Arranged → BOL Issued → Delivered
→ Closed (in customer/distributor history)
```

Each transition is the trigger point for a notification to whichever party owns the next step.

## Requirements by Phase

### Phase 1 — see [phase-1-spec.md](phase-1-spec.md) for full detail
Samples-by-mail flow only, for both private groups and retailers: intake → sample selection → manual sample shipment (Prav enters FedEx tracking) → customer selection + logo upload → auto-generated invoice (tiered pricing) → manual payment confirmation → manual BOL upload → order history + Prav's status dashboard. Notifications are in-app only; no automated email/SMS.

### Phase 2 — automation + house visits
- [ ] House-visit booking: brand-defined open dates → customer picks top choices → brand confirms → both notified → date blocked.
- [ ] Automated pre-visit reminder (address/wifi/door code/rules) with e-signature waiver.
- [ ] Label job record: auto-populates barrel details, notifies designer, tracks status through to a Google Drive link.
- [ ] Auto-generated shipping labels via carrier (FedEx) API.
- [ ] Automated email/SMS notifications for state transitions.
- [ ] QuickBooks integration for distributor payments.
- [ ] Freight/BOL carrier API integration (replacing manual upload).
- [ ] Multi-user support for Prav's team (COO, bottling contractor, label designer as contributors with scoped access).

### Phase 3 — commerce expansion
- [ ] E-commerce/merch storefront (hats, shirts, glasses, etc.).
- [ ] LTO/new-release drop broadcast + first-access ordering link.
- [ ] Online payment processing (Stripe/Square) in-platform.

## Open Questions

Resolved since v0.1:
- ~~Retailer payment visibility~~ → Resolved (per phase-1-spec.md): retailer sees invoice/order status; payment negotiation and confirmation happen between the brand and the distributor, not the retailer.
- ~~Auth/access control~~ → Resolved: simple email/password for Phase 1, no SSO.
- ~~Airtable as system of record~~ → Resolved: not using Airtable; custom-coded stack (see Confirmed Decisions above).

Still open — see phase-1-spec.md's **Blocking** open questions for the ones that gate starting Phase 1 build (pricing logic, state→distributor mapping, exact wiring instructions, retailer shipping address meaning, bottle-quantity estimation method). Beyond those:
- **E-signature for waivers** (ops/legal, Phase 2): Which tool, and does it need to be a "real" e-signature vs. a typed-name acknowledgment?
- **Notification channel for Phase 2** (ops): Email, SMS, or both? Any TCPA/opt-in concern if texting customers?
- **QuickBooks scope** (ops/finance, Phase 2): In-platform status only, or a real two-way sync?
- **Shipping carrier API** (eng, Phase 2): Confirm FedEx as the target for label-generation API integration.

## Timeline Considerations

No hard external deadline mentioned. Phase 1 effort estimate (~3–4 weeks) and full breakdown are in phase-1-spec.md. Phase 2 (house visits, automation, QuickBooks, freight API) and Phase 3 (e-com, LTO) follow once Phase 1 is live and validated with real customers — not yet estimated.

## Success Metrics

- **Leading**: % of picks where status was checked in-app vs. asked about via phone/text (target: majority within first month of use); time from "barrel selected" to "invoice sent" (should shrink once auto-triggered).
- **Lagging**: reduction in picks with a stalled/forgotten handoff; time-to-close per pick quarter-over-quarter; brand's reported time spent on manual coordination.
