# FastBills Frontend Testing Strategy

## Test Philosophy
1. **Unit Testing (Vitest):**
   - Pure utilities (`formatIndianCurrency`, tax preview calculations, date formatters).
   - Custom hooks for URL parameter synchronizations.
2. **Component & Integration Testing (React Testing Library):**
   - Form validation schemas (Zod).
   - Line items table keyboard interactions (Tab, Enter, keyboard navigation).
   - Modal focus trapping and Escape key closures.
3. **End-to-End Testing (Playwright):**
   - Critical user flows: Registration -> Onboarding -> Create Invoice -> Record Receipt -> Download PDF.

## Running Tests

```bash
# Run unit and component tests
npm test

# Run tests in watch mode
npm run test:watch

# Run test coverage report
npm run test:coverage
```
