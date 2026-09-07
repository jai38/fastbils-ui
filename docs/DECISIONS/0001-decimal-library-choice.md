# ADR 0001: Decimal Library Selection (`big.js`)

## Status
Accepted

## Context
JavaScript numbers are 64-bit IEEE 754 binary floating-point values. Standard JavaScript calculations such as `0.1 + 0.2` yield `0.30000000000000004`, which quickly causes 1-paise discrepancies in tax and gross total calculation.

In the invoice editor, a live preview is required so users can see line item subtotals and tax splits as they type. We need an exact decimal arithmetic library.

## Options Considered
1. **`dinero.js`**: Tailored for currency but models money as integer minor units (paise/cents). This makes 3-decimal quantity multiplication (`10.500`) and fractional GST rates (`2.5%`, `9%`) awkward, requiring continuous scale transformations.
2. **`big.js`**: Minimalist (6KB), zero dependencies, handles arbitrary-precision decimal strings, supports configurable rounding modes (`Big.roundHalfUp`), and directly mirrors Java's `BigDecimal`.
3. **`bignumber.js`**: Larger bundle size with scientific notation and advanced features unnecessary for standard invoicing.

## Decision
Adopt **`big.js`** for all arithmetic calculations in `fastbills-ui`. Configure global default rounding to `Big.roundHalfUp` (`Big.RM = 1`).

## Consequences
- Guaranteed mathematical consistency with the backend's `BigDecimal` half-up rounding.
- Minimal bundle impact (< 6KB gzipped).
- Native string compatibility without conversions between major and minor currency units.
