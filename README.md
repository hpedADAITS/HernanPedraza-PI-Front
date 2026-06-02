<div align="center" style="max-width:320px; margin:0 auto;">
  <a align="center" href="https://sr-backend.onrender.com/" target="_blank" rel="noopener noreferrer">
    <img align="center"
      alt="SyncRekuest Logo"
      src="docs/logo.png"
      style="display:block; width:100%; height:auto;"
    />
  </a>
</div>
&nbsp;
<h1 align="center">SyncRekuest Frontend</h1>

React + TypeScript client for DJ events, attendee song requests, realtime queues, and mobile-friendly participation.

## Overview

```text
DJ/attendee browser -> REST /api/v1 -> SyncRekuest backend -> MongoDB
                  `-> Socket.IO rooms <- live queue/song/participant updates
```

The app stores local display/session state, sends identity-sensitive actions to the backend, and normalizes socket/debug payloads in `src/services/socket` before UI state changes.

## Flows

- `/`: role selection.
- `/dj/login`, `/dj/register`, email verification: DJ auth/event setup.
- `/attendee/login`: attendee access-code/QR join.
- Shared dashboard: role-specific profile, queue, now-playing, connected users, settings, actions, QR/access code, microphone controls.
- Song selection: attendees suggest songs; DJs approve/reject pending requests.
- Debug mode: dev-only song/queue lifecycle helpers when `VITE_DEBUG_MODE=true`.
- Phone microphone fallback: `/dj/microphone/:eventId` uses signed backend phone tokens.

## Stack

- React 19, TypeScript, React Router 7, Vite 8
- Tailwind CSS 4, Radix UI, Lucide, custom `src/index.css`
- Motion, Sonner, Socket.IO client
- React Hook Form, `clsx`, `tailwind-merge`, `class-variance-authority`
- QR rendering/scanning, Three.js cover-cube workers
- Vitest/Testing Library/jsdom, Playwright

## Structure

```text
src/
  App.tsx          shell, startup hook, routes, dev debug modal
  main.tsx         React entrypoint
  router/          route definitions/navigation helpers
  pages/           route screens
  components/      reusable UI, layout, dashboard, modal, common components
  features/        dashboard and song-selection hooks/views
  hooks/           app/session/theme/microphone hooks
  services/
    api/           REST client/endpoints
    socket/        contracts, listeners, emitters, normalization
    cache/         asset cache helpers
    session.ts     typed session access
  utils/ constants/ types/
test/ e2e/
vite.config.ts vitest.config.ts playwright.config.ts
```

## Config

Copy `Front/.env.example` to `Front/.env.local`.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend origin; empty uses Vite proxy. |
| `VITE_BACKEND_PROXY_TARGET` | Dev proxy target for `/api` and `/socket.io`; defaults to `http://127.0.0.1:5000`. |
| `VITE_HTTPS_CERT`, `VITE_HTTPS_KEY` | Optional local HTTPS cert/key. |
| `VITE_DEBUG_MODE` | Enables frontend debug helpers in development. |

Vite runs on `127.0.0.1:5173`, strict port, output `build`, alias `@ -> src`.

## Run

```bash
npm install
npm run dev
npm run dev:debug
npm run host
npm run build
npm test
npm run test:ui
npm run test:e2e
npm run format
npm run doctor
```

For normal local development, start the backend separately and leave `VITE_API_URL` empty so Vite proxies REST and Socket.IO traffic to `VITE_BACKEND_PROXY_TARGET`.
