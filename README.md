<p align="center">
  <img src="docs/logo.png" alt="SyncRekuest logo" width="180" />
</p>

<h1 align="center">SyncRekuest Frontend</h1>

<p align="center">
  React + TypeScript client for live DJ events, attendee song requests, realtime queues, and mobile-friendly event participation.
</p>

<p align="center">
  <strong>React 19</strong> · <strong>Vite 8</strong> · <strong>Tailwind CSS 4</strong> · <strong>Socket.IO</strong> · <strong>Vitest</strong> · <strong>Playwright</strong>
</p>

## Overview

The frontend is a Vite + React single-page app for SyncRekuest, a live event music-request experience. It supports two roles:

- **DJs** create/login to an event, manage the live dashboard, approve or reject pending song requests, view connected users, manage the queue, show a QR/access code, and use microphone controls.
- **Attendees** join an event by access code or QR scan, see the current queue/now-playing state, suggest songs, and manage basic profile/app settings.

The app talks to the backend through REST endpoints under `/api/v1` and realtime Socket.IO events for queue, song, participant, and playback updates.

## How it works

```text
DJ browser ─┐
            ├─ REST /api/v1 ───────────► SyncRekuest backend ─► MongoDB
Attendee ───┘
            └─ Socket.IO event rooms ◄── live queue/song/participant updates
```

The UI stores session/display state locally, sends identity-sensitive actions to the backend, and normalizes realtime payloads at the socket boundary before updating dashboard views.

## Key features and flows

- **Role selection** at `/` routes users into DJ or attendee flows.
- **DJ auth and event setup** via `/dj/login`, `/dj/register`, and email verification routes.
- **Attendee join** via `/attendee/login`, including QR scanning support.
- **Shared dashboard** for DJ and attendee modes with role-specific profile cards, queue, now-playing, connected users, settings, and action buttons.
- **Song selection overlay**:
  - Attendees submit title/artist suggestions.
  - DJs search, approve, or reject pending song requests.
- **Realtime updates** use `socket.io-client`, with normalization helpers in `src/services/socket` to keep UI state compatible with backend/debug payload variants.
- **Local session/cache** stores auth token, current user/event/participant, preferences, and UI-only receipts in browser storage.
- **Debug mode** is dev-only and can simulate song-card/queue lifecycle behavior when `VITE_DEBUG_MODE=true`.
- **Phone microphone fallback** route `/dj/microphone/:eventId` connects a phone as a microphone client through a signed backend URL/token flow.

## Stack

- **Runtime/UI:** React 19, TypeScript, React Router 7
- **Build/dev server:** Vite 8 with `@vitejs/plugin-react`
- **Styling:** Tailwind CSS 4 via `@tailwindcss/vite`, Radix UI primitives, Lucide icons, custom CSS in `src/index.css`
- **Animation/toasts:** Motion, Sonner
- **Realtime:** Socket.IO client
- **Forms and utilities:** React Hook Form, `clsx`, `tailwind-merge`, `class-variance-authority`
- **Media/visuals:** QR code rendering, `jsqr` QR scanning, Three.js cover-cube components/workers
- **Testing:** Vitest + Testing Library + jsdom, Playwright for E2E

## Project structure

```text
Front/
  src/
    App.tsx                 App shell, startup hook, routes, dev debug modal
    main.tsx                React entrypoint
    router/                 Route definitions and view navigation helpers
    pages/                  Top-level route screens
    components/             Reusable UI, layout, dashboard, modal, common components
    features/               Feature-specific hooks/views for dashboard and song selection
    hooks/                  App/session/theme/microphone hooks
    services/
      api/                  REST API client and endpoint modules
      socket/               Socket connection, event contracts, emitters/listeners, normalization
      cache/                Frontend cache helpers
      session.ts            Typed session access helpers
    utils/                  Storage migration, validation, debug helpers
    constants/              UI constants
    types/                  Shared frontend types
  test/                     Unit/component tests
  e2e/                      Playwright tests
  vite.config.ts            Vite config, aliases, dev proxy, optional HTTPS
  vitest.config.ts          Vitest config
  playwright.config.ts      E2E config
  package.json              Scripts and dependencies
```

## Environment and config

Copy `Front/.env.example` to `Front/.env.local` for local overrides.

| Variable | Purpose | Default |
| --- | --- | --- |
| `VITE_API_URL` | Backend origin. If set to `https://host`, API calls use `https://host/api/v1` and sockets connect to that origin. Leave empty for the Vite dev proxy. | empty |
| `VITE_BACKEND_PROXY_TARGET` | Vite dev proxy target for `/api` and `/socket.io`. | `http://127.0.0.1:5000` |
| `VITE_HTTPS_CERT` / `VITE_HTTPS_KEY` | Optional local HTTPS certificate/key paths for Vite. | unset |
| `VITE_DEBUG_MODE` | Enables frontend debug helpers in development. `npm run dev:debug` sets this to `true`. | unset |

Local Vite dev server settings are in `vite.config.ts`: host `127.0.0.1`, port `5173`, strict port enabled, output directory `build`, and `@` aliased to `src`.

## Install and run

Run commands from this folder.

```bash
npm install
npm run dev
```

Useful scripts:

```bash
npm run dev          # Start Vite on 127.0.0.1:5173
npm run dev:debug    # Start Vite with VITE_DEBUG_MODE=true
npm run host         # Start Vite with --host for LAN/device testing
npm run build        # Production build to Front/build
npm test             # Vitest unit/component tests
npm run test:ui      # Vitest UI
npm run test:e2e     # Playwright E2E tests
npm run format       # Prettier write over Front
npm run doctor       # React Doctor diagnostics
```

For normal local development, start the backend separately and leave `VITE_API_URL` empty so Vite proxies REST and Socket.IO traffic to `VITE_BACKEND_PROXY_TARGET`.
