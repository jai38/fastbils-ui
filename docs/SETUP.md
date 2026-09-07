# FastBills Frontend Setup Guide

## Prerequisites
- Node.js >= 20.0.0 (`node -v`)
- npm >= 10.0.0 (`npm -v`)

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Set `VITE_API_BASE_URL=http://localhost:8080` to target the local backend.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   The UI will be accessible at `http://localhost:5173`.

4. **Regenerate API Client:**
   When the backend OpenAPI document changes:
   ```bash
   npm run codegen:api
   ```
