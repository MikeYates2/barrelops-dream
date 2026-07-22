# Dream Spirits Barrel Selection Platform — Phase 1 Spec

**Status**: Scope Definition  
**Phase**: 1 of 3  
**Owner**: Prav Saraff  
**Last Updated**: July 2026

---

## Problem Statement

Dream Spirits currently manages barrel selection requests across private groups and retailers through manual email/phone coordination. The team manually tracks contact info, sample orders, selections, invoicing, and payment status across multiple systems, creating delays, miscommunication, and a poor customer experience. A centralized digital platform is needed to streamline this workflow and give all parties (brand, customers, distributors) visibility into where they are in the process.

---

## Goals (Phase 1)

1. **Eliminate manual coordination**: Move from email/phone to a single source of truth that automates notifications and status updates.
2. **Self-serve customer intake**: Customers fill out contact form and select samples without requiring manual follow-up from Prav or the team.
3. **Reduce invoice and payment tracking overhead**: Generate invoices automatically and provide a dashboard to see payment status at a glance.
4. **Create order history**: Customers and Prav can see what was purchased, when, and for how much.
5. **Support both customer types**: Handle private groups and retailer flows with different pricing and payment mechanics.

---

## Non-Goals (Phase 1)

- **In-person tasting scheduling**: Skip the calendar/booking feature for now. Phase 1 supports samples-by-mail only.
- **Automated label generation**: Labels will be created manually and uploaded; don't automate the Google Drive/label designer workflow yet.
- **Shipping label generation**: Prav still manually creates FedEx labels; the system won't auto-generate them.
- **BOL and freight tracking**: No freight carrier integration. Prav manually uploads BOLs; customers see it but don't automate the freight notification.
- **Notifications/emails**: Manual for Phase 1. Instead of SMS/email, the app itself is the notification source. Prav checks the app and manually sends key updates if needed.
- **E-commerce/merch**: No storefront. Keep focus on barrel selection only.
- **LTO/new release notifications**: Skip for Phase 1. Too much can wait.
- **Online payment processing**: Retailers and private groups still wire/mail checks. No Stripe integration yet.

---

## User Stories

### Prav (Brand Owner)
- As Prav, I want to see a dashboard of all active customers and where they are in the barrel selection process so that I know what needs my attention today.
- As Prav, I want to mark a customer as "paid" when I receive their wire transfer so that I can move them to the next step (freight).
- As Prav, I want to view historical orders (customer name, date, barrels purchased, price paid) so that I can track sales and spot return customers.
- As Prav, I want to assign a distributor to a retailer customer automatically based on their state so that I don't have to look it up manually.
- As Prav, I want to upload a BOL for a customer once they've paid so that they can see their tracking info.
- As Prav, I want to see profitability metrics (cost of goods, price, margin) for each barrel sold.

### Private Group Customer
- As a private group customer, I want to fill out a quick form with my contact info and select samples from available barrels so that I can start the ordering process without calling.
- As a private group customer, I want to see when my samples ship and track them in real time so that I know when to expect delivery.
- As a private group customer, I want to go back into the app after receiving samples and tell the system which barrels I'm buying so that I have a clear record of my selection.
- As a private group customer, I want to upload a screenshot of my wire transfer and see confirmation that Prav received it so that I have peace of mind.
- As a private group customer, I want to see my BOL and track my freight shipment so that I know when my bottles will arrive.
- As a private group customer, I want to see my order history (what I bought, when, how much I paid) so that I can reorder or reference it.

### Retailer Customer
- As a retailer, I want to fill out a form with my business info and state so that the system knows which distributor to assign to me.
- As a retailer, I want to select samples the same way a private group does so that the ordering process is consistent.
- As a retailer, I want to receive an invoice that's sent to my distributor, not me, so that the distributor handles fulfillment.
- As a retailer, I want to see my order history including what my distributor has paid and outstanding invoices so that I can track what's owed.

---

## Core User Flows

### Flow 1: Private Group (Samples)
1. **Intake**: Customer fills form → selects type (private group) → enters name, email, phone, shipping address.
2. **Sample Selection**: System displays available barrels. Customer selects which ones to request samples from.
3. **Sample Shipment**: Prav pulls samples, manually creates label, ships via FedEx. System stores tracking number (manual entry).
4. **Selection**: Customer receives samples, comes back to app, uploads logo, selects which barrels to buy (can be different from samples requested).
5. **Invoice**: System generates invoice with selected barrels, pricing, total. Displayed in app.
6. **Payment**: Customer wires money, uploads proof of wire in app. Prav reviews and marks as "paid."
7. **Freight**: Once paid, Prav uploads BOL. Customer sees tracking info.
8. **Closure**: Order is "complete." History is retained.

### Flow 2: Retailer (Samples)
1. **Intake**: Customer fills form → selects type (retailer) → enters business name, state, contact info.
2. **System Assignment**: Distributor is auto-assigned based on state lookup table.
3. **Sample Selection**: Same as private group.
4. **Selection & Invoice**: Same as private group, but invoice is flagged for distributor.
5. **Distributor Payment**: Invoice is sent to distributor (manual email or printed). Distributor pays Prav directly or via QuickBooks.
6. **Freight**: Prav arranges freight, uploads BOL.
7. **Retailer Visibility**: Retailer can see invoice status but payment is between Prav and the distributor.

---

## Requirements

### P0 — Must Have

#### Customer Intake
- [ ] Contact form with fields: Name, Email, Phone, Shipping Address (street, city, state, zip)
- [ ] Customer type selector: "Private Group" or "Retailer"
- [ ] If Retailer: State dropdown to assign distributor, plus an address-type selector ("Store location" or "Warehouse/distribution address") since this varies by retailer
- [ ] Acceptance: Form validates all required fields, stores customer record, assigns distributor for retailers

#### Barrel Inventory & Sample Selection
- [ ] Admin panel for Prav to upload barrel inventory (barrel number, age, distillery, description, price for private groups, price for retailers, estimated bottle count)
- [ ] Customer-facing page showing available barrels with descriptions
- [ ] Customer can select which barrels to request samples from (checkbox/multi-select)
- [ ] Acceptance: Customer can select 1–X barrels, submit request, system stores selections

#### Order Management Dashboard (Prav Only)
- [ ] Dashboard showing all customers, sorted by stage (Intake → Sample Selection → Awaiting Sample → Selection → Invoice Generated → Awaiting Payment → Shipped → Complete)
- [ ] Click into a customer to see full order details: contact info, selected barrels, invoice, payment status, BOL
- [ ] Acceptance: Prav can see at a glance where each customer is; clicking a customer shows all relevant data

#### Sample Shipment Tracking (Manual Entry)
- [ ] After customer selects samples, Prav manually enters the FedEx tracking number
- [ ] Customer gets a notification (in-app message, not email) saying "Your samples ship with tracking #XYZ"
- [ ] Customer can see tracking number in their order
- [ ] Acceptance: Tracking number is stored and displayed to customer; link to FedEx works

#### Selection & Logo Upload
- [ ] Customer receives samples, comes back to app
- [ ] Customer sees the barrels they requested samples from and can indicate which ones to buy
- [ ] Customer can upload a logo image (JPG/PNG, size limit enforced)
- [ ] System records selections and logo
- [ ] Acceptance: Prav sees "Logo received" status; logo is stored; selections are saved

#### Invoice Generation
- [ ] System auto-generates invoice based on selected barrels and customer type (private group vs retailer pricing)
- [ ] Invoice includes: Barrel number, age, distillery, quantity (uses the barrel's Prav-entered estimated bottle count until the actual bottling run is logged, then reflects the real count), unit price, total
- [ ] Invoice is flagged if customer is a retailer (sends to distributor, not customer)
- [ ] Invoice is viewable/downloadable as PDF in the app
- [ ] Acceptance: Invoice is generated correctly with right prices; different price shown for retailer vs private group; invoice shows in both Prav's and customer's view

#### Payment Tracking (Manual)
- [ ] Private group customers see payment instructions (wiring details) on their invoice
- [ ] Customer can upload a screenshot of wire confirmation or note that they mailed a check
- [ ] Prav gets a notification that customer uploaded payment proof
- [ ] Prav can mark customer as "paid" with a button click
- [ ] Once marked paid, customer sees "payment received" status
- [ ] Acceptance: Prav can toggle "paid" status; customer sees status change reflected in real time

#### BOL (Bill of Lading) Upload
- [ ] Once customer is marked paid, Prav can upload BOL document
- [ ] Customer sees BOL and any freight tracking info (manual entry for now)
- [ ] Acceptance: BOL appears in customer's order; Prav can replace/update it

#### Order History
- [ ] Customers (both types) see a "My Orders" page showing all past and current orders
- [ ] Each order shows: Date, barrels purchased, quantity, price, payment status, delivery status
- [ ] Prav can filter/search by customer name, date, barrel, status
- [ ] Acceptance: Customer can pull up all their orders; Prav can search and filter

#### Admin Settings
- [ ] Prav can manage state-to-distributor mapping (lookup table)
- [ ] Prav can add/edit barrel inventory (name, age, distillery, description, private group price, retailer price)
- [ ] Acceptance: Prav can update the barrel list and state/distributor mappings without code changes

---

### P1 — Nice to Have (Build in Phase 1 if time permits)

- [ ] Basic profitability dashboard for Prav (cost of goods, price, margin by barrel)
- [ ] Prav can add notes to an order (e.g., "Customer prefers samples under 12 years old")
- [ ] Email notification option (in addition to in-app) when invoice is ready or payment is received
- [ ] Customer can see an estimate of their order total before uploading logo
- [ ] Logo preview before order is finalized

---

### P2 — Future Considerations (Phase 2+)

- [ ] In-person tasting calendar booking
- [ ] Automated label generation from logo + barrel info
- [ ] Automated email/SMS notifications
- [ ] Online payment processing (Stripe/Square)
- [ ] BOL/freight carrier API integration
- [ ] Merch e-commerce section
- [ ] LTO/new release notification system
- [ ] Multi-user support for Prav's team (COO, bottling guy, etc. as contributors)

---

## Success Metrics (Phase 1)

### Leading Indicators (Measured 2 weeks after launch)
- **Customer adoption**: 80% of new sample requests come through the app (vs. email/phone)
- **Form completion rate**: 95%+ of customers who start the intake form complete it
- **Dashboard engagement**: Prav opens the dashboard at least once daily
- **Time to invoice**: Average time from customer selection to invoice generation drops from 2 days to <1 hour

### Lagging Indicators (Measured 1 month after launch)
- **Error rate**: <5% of invoices require manual correction
- **Payment confirmation time**: Average time from customer wire to Prav marking paid drops from 3 days to <1 day
- **Return customer experience**: Repeat customers can place new orders 2x faster than first-time customers

---

## Tech Stack Recommendation (Phase 1)

**Frontend**:
- React (or similar) for the web app
- Tailwind CSS for styling
- React Router for navigation

**Backend**:
- Node.js + Express (or Python + Flask) for API
- PostgreSQL for database
- Authentication: Simple email/password (no SSO yet)

**File Storage**:
- AWS S3 or similar for logo uploads, BOL storage

**Hosting**:
- Vercel (frontend), AWS/Heroku (backend), or similar

**No External Integrations for Phase 1**:
- No email service (manual messages in app only)
- No payment processor
- No freight/shipping APIs
- Manual FedEx label creation

---

## Database Schema (High Level)

```
Customers
  - id, name, email, phone, shipping_address
  - address_type (store | warehouse) — retailers only
  - customer_type (private_group | retailer)
  - state (if retailer)
  - assigned_distributor
  - created_at

Orders
  - id, customer_id
  - status (intake → sample_selection → sample_shipped → selection → invoice_generated → awaiting_payment → paid → freight_booked → complete)
  - selected_barrel_ids (JSON)
  - requested_sample_barrel_ids (JSON)
  - logo_url
  - tracking_number (for samples)
  - created_at, updated_at

OrderItems
  - id, order_id, barrel_id, quantity, unit_price, total_price

Invoices
  - id, order_id, total_amount, is_for_retailer
  - created_at, sent_to_distributor_at

Payments
  - id, order_id, payment_method (wire | check | other)
  - amount, proof_url (screenshot/confirmation)
  - status (pending | confirmed)
  - confirmed_at

BOLs
  - id, order_id, bol_url, freight_tracking_number

Barrels (Inventory)
  - id, barrel_number, age, distillery, description
  - price_private_group, price_retailer
  - estimated_bottle_count (Prav-entered at listing time; used for invoicing until actual count is logged)
  - available (boolean)

StatesToDistributors
  - state, distributor_name
```

---

## Open Questions

**Resolved**:
- [x] **Pricing**: No formula — Prav sets private-group price and retailer price independently per barrel at listing time. (Schema already supports this: `price_private_group`, `price_retailer` on Barrels.)
- [x] **Shipping Address**: Varies by retailer — add an `address_type` field (store | warehouse) to the intake form rather than assuming one.
- [x] **Bottle Quantity**: Prav enters a per-barrel estimate manually at listing time (barrels vary in fill/loss); this estimate drives invoicing until the real bottling-run count replaces it.

**Data needed before launch, not before build starts** — these are admin-editable data (a lookup table and an invoice-template field), so the feature can be built now with placeholder values and populated with real data before onboarding actual customers:
- [ ] **Distributor States**: Which states go to which distributors? Provide the mapping when available.
- [ ] **Payment Instructions**: Exact wiring instructions to display on invoices. If you'd rather not put real bank details in a doc/chat, that's fine — enter them directly in the admin settings once the app is running.

**Non-Blocking** (can resolve during implementation):
- [ ] Do you want to let customers partially re-select (e.g., request 5 samples but only buy 2 of those 5)?
- [ ] Should Prav be able to set a minimum order quantity or price?
- [ ] Do you want a "draft" invoice that customers can see before committing?
- [ ] Should the app support multiple recipients per order (e.g., one order, multiple shipping addresses)?

---

## Scope Boundaries

**In Scope**: Customer intake → Sample request → Selection → Invoice → Payment tracking → Order history.

**Out of Scope**: In-person tastings, automated notifications, label/BOL generation, payment processing, freight integration, merch, LTOs.

**If scope creeps**: Any new feature request must come with either a timeline extension or a removal of an existing P0 requirement.

---

## Estimated Effort (Rough)

- **Backend API & Database**: 1–2 weeks
- **Frontend (Forms, Dashboards, Order Tracking)**: 1–1.5 weeks
- **Admin Panel (Barrel Inventory, Settings)**: 3–4 days
- **Testing & Polish**: 3–5 days

**Total**: ~3–4 weeks for a solid, shippable Phase 1 with Claude Code.

---

## Next Steps

1. **Clarify Open Questions**: Prav to provide the state/distributor mapping, pricing logic, and wiring instructions.
2. **Design Phase**: Whiteboard key screens (intake form, sample selection, customer dashboard, payment confirmation).
3. **Database Design**: Finalize schema based on Q&As.
4. **Implementation**: Start with backend API and database, then build frontend.
5. **Testing**: Test all flows end-to-end with realistic data.
6. **Launch**: Private beta with a few trusted customers before full rollout.
