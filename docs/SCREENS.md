# FastBills Screen Specifications

This document outlines the screens, visual density, interactions, validation rules, and endpoints called across `fastbills-ui`.

## General Styling Philosophy
- Dense, quiet, professional accounting tool aesthetics.
- High contrast, legible tabular numbers (`font-mono` / tabular-nums).
- Keyboard-operable workflows with visible focus rings.

---

## 1. Auth Screens
- **Register (`/register`):** Organisation legal name, trade name, owner full name, email, password, optional GSTIN and state code. Calls `POST /api/v1/auth/register`.
- **Login (`/login`):** Email, password. Calls `POST /api/v1/auth/login`.

## 2. Onboarding Wizard (`/onboarding`)
- Step 1: Business details (GSTIN, PAN, addresses, bank details).
- Step 2: Invoice prefix and series start (with live preview of resulting invoice number).
- Step 3: First customer entry.

## 3. Dashboard (`/dashboard`)
- 5 Header KPI cards: Total Outstanding, Overdue, Crossed 45 Days, Received This Month, Invoices Raised This Month.
- Horizontal ageing bucket breakdown (Current, 1-30, 31-45, 46-60, 61-90, 90+ days).
- Oldest 10 unpaid invoices list.

## 4. Invoices (`/invoices`)
- **Invoice List:** TanStack Table with server-side pagination, sorting, and filters (Date range, Customer, State, Status, Amount). URL sync.
- **Invoice Editor (`/invoices/new`, `/invoices/:id/edit`):**
  - Keyboard-first tabular data entry (Tab through fields, Enter on last cell to append line).
  - Searchable inline customer picker.
  - Place of supply state selector with tax split notification.
  - Live preview totals block using `big.js`.
  - Autosave draft.
  - Two-step issue confirmation modal.
- **Invoice Detail (`/invoices/:id`):** Read-only immutable document view, receipts history, running balance, audit trail, and actions (Download PDF, Record Receipt, Cancel).

## 5. Record Receipt Modal
- Fast modal triggered from invoice row or detail view.
- Pre-fills today's date and outstanding balance.
- Payment method selector (`CASH`, `UPI`, `NEFT`, `RTGS`, `IMPS`, `CHEQUE`, `CARD`, `OTHER`).
- Previews resulting balance and status prior to submission.

## 6. Customers (`/customers`)
- Customer list with search and outstanding balance column.
- Customer detail page showing all past invoices, receipts, and average days to pay.
- Archival action (with explanation against permanent deletion).

## 7. Reports (`/reports`)
- 5 Statutory reports: Invoice Register, Revenue Summary, Tax Slab Summary, Receivables Ageing, Receipts Register.
- Date range and customer filtering with one-click CSV and XLSX export.
