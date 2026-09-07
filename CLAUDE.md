# Operating Manual: fastbills-web (`fastbills-ui`)

Authoritative business rules are in `docs/DOMAIN.md`. Never deviate from them.

## Non-Negotiable Frontend Rules

1. **Money is never a JavaScript `number`.** The API sends `BigDecimal` as strings. Keep it as strings end-to-end. Parse only inside `big.js` for arithmetic (with `Big.RM = Big.roundHalfUp`). Format for display strictly via the shared `formatIndianCurrency(amount)` utility (`src/utils/money.ts`). Never format inline.
2. **The server owns arithmetic.** The frontend calculates live previews in the invoice editor purely as an unauthoritative convenience. Never send computed totals, tax splits, or supply type to the API.
3. **TypeScript Strict.** No `any`, no non-null assertions (`!`) to silence the compiler, no `@ts-ignore` without explanation. API types are generated via `openapi-typescript` into `src/api/schema.ts` and never hand-duplicated.
4. **Server state belongs in TanStack Query.** No Redux, no global client store for server data. URL query parameters hold filter/search state.
5. **Accessibility Floor.** Real `<label>` for every input, keyboard-operable workflows (Tab, Enter, Escape), visible focus rings, semantic table headers, and status badges with explicit text and color.
6. **Dense, Quiet Design.** Accounting tool density. Data first, decoration last. No bloated component libraries.

## Build and Test Commands

```bash
# Install dependencies
npm install

# Start local dev server (port 5173)
npm run dev

# Run unit tests
npm test

# Typecheck and build
npm run build

# Lint
npm run lint

# Regenerate API client types from backend OpenAPI JSON
npm run codegen:api
```

## Folder Layout (`src/`)

- `api/`: Generated schema (`schema.ts`), typed client (`client.ts`), query hooks (`queries/`).
- `components/`:
  - `layout/`: `AppShell.tsx`, `Header.tsx`, `Sidebar.tsx`.
  - `ui/`: Primitives (Button, Input, Modal, Badge, Table).
- `features/`: Feature modules (auth, organisation, customers, invoices, receipts, reports).
- `utils/`: `money.ts`, date formatting (`date.ts`), validation helpers.
- `types/`: Domain TypeScript types augmenting generated API types.

## Mistakes to Avoid

- Never let any monetary value touch a native JavaScript `number`.
- Never compute tax in the browser and send it to the server.
- Never format currency without Indian digit grouping (`23,50,000.00`).
- Never store table filter state in local component state (keep in URL).
- Never render or download invoice PDFs from the browser DOM; fetch server-rendered PDF.
- Never let an issued invoice appear editable.
- Never hide delivery/acceptance date or agreed credit days.
