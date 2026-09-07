# ADR 0002: PWA Offline Strategy and Service Worker Caching

## Status
Accepted

## Context
FastBills operators often work in environments with intermittent internet connectivity (e.g. warehouses, remote offices, retail counters). The UI needs to load instantly and handle temporary connection drops gracefully without corrupting financial transactions.

## Decision
1. **Web App Manifest (`manifest.webmanifest`):**
   - Configured with `display: "standalone"`, `orientation: "portrait-primary"`, brand color `#0284c7`, and high-resolution SVG branding icons.
2. **Service Worker (`sw.js`):**
   - **Static Shell Assets:** Pre-cached on install and served via a cache-first strategy with background revalidation.
   - **API Calls (`/api/*`):** Never cached for mutation requests (`POST`, `PUT`, `DELETE`). Read queries use a network-first strategy. If offline, the worker returns a structured JSON `503 Service Unavailable` response (`{"error": "OFFLINE", "message": "..."}`) rather than a raw browser crash.
   - **Navigation Fallback:** Navigations when offline fallback to the cached `/index.html` application shell.
3. **Mobile Layout (`AppShell.tsx`):**
   - Responsive fixed bottom navigation bar on mobile screens (`sm:hidden`) provides 1-tap thumb navigation for core functions: Dashboard, Invoices, Credit Notes, Customers, Reports, and Settings.

## Consequences
- Fast, instant app loading and native-like installation capability on Android, iOS, Windows, and macOS.
- Financial mutations remain strictly online-verified, preventing duplicate sequence allocations or ghost invoices.
