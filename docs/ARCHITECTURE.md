# FastBills Web Frontend Architecture

This document describes the architectural conventions, state management patterns, form handling, and money representation for `fastbills-ui`.

## Core Principles

1. **Exact String Money Handling**
   - Money is sent from the backend API as exact strings (`"14250.00"`).
   - The frontend stores money as strings in state and form inputs.
   - Live invoice previews perform arithmetic exclusively using `big.js` configured with `Big.RM = Big.roundHalfUp`.
   - Display formatting runs through a single shared utility `formatIndianCurrency` using Indian digit grouping (`23,50,000.00`) and the Rupee symbol (`₹`).

2. **Server State vs URL State vs Local State**
   - **Server State:** Handled 100% by TanStack Query (`@tanstack/react-query`). Caching, background refetching, and mutation invalidation.
   - **Filter State:** Kept in URL search parameters (`useSearchParams`). Every table filter, sort order, and page index is bookmarkable and shareable.
   - **Form & Transient State:** Handled by React Hook Form (`react-hook-form`) with Zod schemas. Modals and dropdowns use local component state.

3. **Generated API Client**
   - The TypeScript API types are generated directly from the backend's OpenAPI 3 specification using `openapi-typescript`.
   - The generated schema file (`src/api/schema.ts`) is committed to version control so the project builds offline without a live backend.
   - A type-safe fetch wrapper (`src/api/client.ts`) handles JWT authentication headers, base URL routing, and standard error handling.

## Directory Responsibilities

```
src/
  api/               Generated types and typed fetch client
  components/
    layout/          AppShell, TopNav, Sidebar, PageContainer
    ui/              Handcrafted lightweight primitives (Button, Input, Select, Badge, Modal)
  features/          Feature slices organized by domain
    auth/            Login, registration, token refresh
    organisation/    Settings, profile, bank accounts
    customers/       Customer grid, customer details, create/edit modals
    invoices/        Invoice editor (keyboard-first), invoice list, invoice detail view
    receipts/        Record receipt modal, receipts ledger
    reports/         5 report screens with CSV/XLSX export triggers
  utils/
    money.ts         Indian numbering format and big.js arithmetic helpers
    date.ts          Indian date formatters (DD/MM/YYYY)
```
