# ProcureFlow

A lightweight, multi-tenant procurement and vendor-payment platform for mid-size companies. Manage RFQs, purchase approvals, and vendor payouts in one auditable system instead of email threads and spreadsheets.

**Live app:** https://procureflow-frontend-nu.vercel.app
**Backend API:** https://procureflow-backend-6ilc.onrender.com

> Note: the backend is hosted on Render's free tier, which spins down after inactivity. The first request after idle time may take ~50 seconds to respond.

---

## Problem

Mid-size companies (50–500 employees) coordinate vendor sourcing and purchase approvals over email and spreadsheets. There's no audit trail, approval chains get lost in inboxes, and payment status is opaque to everyone except finance. Enterprise procurement suites (SAP Ariba, Coupa) are priced and built for large enterprises, leaving this segment underserved.

## Solution

ProcureFlow gives a structured, auditable workflow from purchase request to vendor payout:

**RFQ → Vendor Quotes → Award → Purchase Order → Multi-step Approval → Invoice → Finance Approval → Payment Release**

Every step is logged, every approval is attributed to a specific person, and payment completion is only ever confirmed by a cryptographically verified webhook — never a client-side "mark as paid" action.

---

## Architecture

**Modular monolith**, not microservices — complexity is concentrated in the approval-workflow state machine and multi-tenant authorization, not in unnecessary infrastructure.

frontend/ React + TypeScript + Vite + Tailwind v4
src/features/ one folder per domain (auth, vendors, rfqs, invoices, dashboard...)
src/app/ shared layout, protected routes, UI primitives

backend/ Node + Express + TypeScript
src/modules/ one folder per domain, each with routes -> controller -> service
src/middleware/ auth (JWT), RBAC, tenant scoping, rate limiting
prisma/ schema + migrations

packages/shared/ (scaffolded for cross-package types; not yet in active use)


### Tech stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, React Router, React Three Fiber (3D visuals), Framer Motion, Recharts, Axios
- **Backend:** Node.js, Express, TypeScript, Zod validation, Prisma ORM
- **Database:** PostgreSQL (Neon, serverless)
- **Auth:** JWT + bcrypt, custom RBAC middleware
- **Payments:** Razorpay (Route/Transfer architecture — see note below)
- **Testing:** Vitest
- **Deployment:** Vercel (frontend), Render (backend)

---

## Database schema

15 models covering the full domain: `Organization`, `User`, `Vendor`, `OrganizationVendor` (shared vendor identity across tenants), `RFQ`, `RFQVendorInvite`, `Quote`, `QuoteLineItem`, `PurchaseOrder`, `POLineItem`, `ApprovalChainTemplate`, `ApprovalChainStepDef`, `ApprovalInstance`, `ApprovalStep`, `Invoice`, `Payment`.

**Key design decisions:**
- Every tenant-scoped table carries an `organizationId`, indexed, and never trusted from the client — it comes only from the authenticated JWT.
- Vendors use a shared-identity model: one `Vendor` record can be linked to multiple organizations via `OrganizationVendor`, each with its own status and notes — reflecting how a real vendor works with several client companies.
- Approval logic is separated into **template** (`ApprovalChainTemplate` + `ApprovalChainStepDef`, the configurable definition) and **instance** (`ApprovalInstance` + `ApprovalStep`, the actual runtime audit trail). This lets the same engine drive both Purchase Order approval and Invoice finance sign-off without duplicating logic.

---

## Security

- Passwords hashed with bcrypt; JWTs signed with a strong secret, 15-minute expiry
- Every database query for tenant-scoped resources filters by `organizationId` sourced only from the verified JWT — never from client input
- Role-based access control middleware (`BUYER`, `APPROVER`, `FINANCE_ADMIN`, `SUPER_ADMIN`)
- Rate limiting on auth routes (10 failed attempts per 15 minutes per IP)
- Razorpay webhook signature verification via HMAC-SHA256 — a payment is only ever marked complete after cryptographic proof, never a client request
- CORS locked to the deployed frontend origin in production
- No secrets (JWT secret, Razorpay key secret, database URL) are ever exposed to the frontend bundle — verified by searching the production build output

---

## API overview

All routes under `/api`, JSON in/out, Zod-validated request bodies.

| Module | Routes |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Vendors | `POST /vendors`, `GET /vendors` |
| RFQs | `POST /rfqs`, `GET /rfqs`, `GET /rfqs/:id` |
| Quotes | `POST /rfqs/:rfqId/quotes`, `POST /rfqs/:rfqId/quotes/:quoteId/select` |
| Purchase Orders | `POST /purchase-orders`, `GET /purchase-orders`, `GET /purchase-orders/:id` |
| Approvals | `GET /approvals/:id`, `POST /approvals/:id/decide` |
| Invoices | `POST /invoices`, `GET /invoices`, `GET /invoices/:id` |
| Payments | `POST /payments`, `GET /payments/invoice/:invoiceId`, `POST /payments/webhook` (unauthenticated, signature-verified) |
| Analytics | `GET /analytics/summary`, `GET /analytics/spend-by-vendor`, `GET /analytics/network` |

Consistent error shape: `{ "error": "SOME_CODE" }` with appropriate HTTP status (400/401/403/404/409/422/429/500).

---

## Local setup

```bash
git clone https://github.com/MandarJoshii/procureflow.git
cd procureflow

# backend
cd backend
pnpm install
cp .env.example .env
pnpm prisma migrate dev
pnpm dev

# frontend (new terminal)
cd ../frontend
pnpm install
cp .env.example .env
pnpm dev
```

### Environment variables

**Backend (`.env`):**

DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=15m
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
FRONTEND_URL=http://localhost:5173
PORT=4000

**Frontend (`.env`):**
VITE_API_URL=http://localhost:4000


---

## Testing

```bash
cd backend
pnpm test
```

Prioritized tests on the highest-risk logic rather than exhaustive coverage:
- Webhook signature verification (accepts valid signatures, rejects forged ones, rejects tampered payloads reusing a valid signature)
- Approval authorization (only the assigned approver can act on a step; rejects decisions on already-finalized approvals)

---

## Known limitations & honest scoping notes

- **Razorpay Route is architecturally complete but not live-verified.** Real vendor payouts via Route require Razorpay business KYC, which is out of scope for a demo project. The payment service, webhook handler, and signature verification are built exactly as production Route integration would require; the webhook is currently configured against the `payment.captured` event (available without KYC) as the closest testable substitute for the `transfer.processed` event Route would emit.
- **Free-tier hosting.** The backend (Render free tier) spins down after inactivity; the first request after idling takes longer.
- **Approval chains ship with a sensible default** (single-step, first available approver) rather than requiring manual configuration before the system is usable. The schema fully supports multi-step, department-scoped, threshold-based chains — the UI for authoring custom chains is a natural next feature.
- **Bundle size:** the production frontend bundle is ~1.7MB (largely Three.js/React Three Fiber for the 3D visuals). Code-splitting the 3D dependencies to lazy-load only on the auth and dashboard pages is a known follow-up optimization.

---

## What's next

- Vendor-side portal (vendors currently interact via records entered by org staff, not their own login)
- Configurable approval chain builder UI
- Full Razorpay Route activation post-KYC
- PDF export for POs and invoices
- Automated code-splitting for the 3D bundle

---

Built over 7 days as a portfolio project, end to end: architecture, schema design, backend, frontend, 3D visualization, security hardening, testing, and deployment.