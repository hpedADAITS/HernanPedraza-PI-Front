# Frontend flaws audit

This document records the main structural and code-quality flaws found in the React/TypeScript frontend. It is intentionally focused on architecture, component syntax, and maintainability rather than whether the current build passes.

## Executive summary

The frontend is functional, but too much application behavior lives inside route pages and large dashboard components. Many components mix rendering, API calls, socket subscriptions, localStorage/session reads, animation logic, domain normalization, and error handling in the same file. The result is hard to reason about, hard to refactor safely, and easy to regress when changing realtime or session behavior.

## Highest-risk files

- `src/components/dashboard/QueueList.tsx` — still a large queue renderer, but the fetch/listener/realtime state now lives in `useQueueRealtime`.
- `src/components/dashboard/ConnectedUsers.tsx` — large mixed-responsibility participant/admin UI with realtime participant handling and moderation actions.
- `src/components/dashboard/ActionButtons.tsx` — action/navigation UI mixed with socket-driven behavior and modal/prompt flows.
- `src/components/dashboard/NowPlayingSection.tsx` — realtime state and display behavior in the component layer.
- `src/pages/DJRegister.tsx` — large route component with multi-step flow.

## Structural flaws

### 1. Folders are not consistently feature-owned

The project has `pages`, `components`, `hooks`, `services`, `utils`, and `types`, but behavior ownership is unclear. Dashboard code is split across `pages`, `components/dashboard`, `hooks`, `services/socket`, `services/session`, and `utils`, yet the feature logic still leaks into components.

Recommended direction:

- `src/features/dashboard`
- `src/features/song-selection`
- `src/features/realtime`
- `src/features/session`
- `src/features/settings`

Each feature should own its UI, controller hooks, local types, and adapters where practical.

### 2. Route pages are doing too much

Pages should mostly compose route-level layout and feature components. Current route pages often contain business logic and interaction controllers.

Examples:

- `DJRegister.tsx` owns a complex registration flow directly in the page.

### 3. Dashboard components are not presentational

Dashboard components are named like UI components but act like feature controllers. They read session data, call APIs, subscribe to sockets, normalize payloads, compute derived state, show toasts, and render UI.

This makes them difficult to test and reuse because rendering cannot be changed independently from side effects.

### 4. Realtime boundaries are still leaky

Socket payload normalization exists in `src/services/socket/normalize.ts`, which is good, but components still handle raw payload compatibility details and use broad payload types in several places.

Examples:

- Debug song events are handled in the same component effects as production socket events.

### 5. Session/localStorage boundaries are inconsistent

Typed session helpers exist in `src/services/session.ts`, but components and pages still read localStorage or storage helpers directly. This spreads identity and persistence assumptions across the UI.

Examples:

- `useDarkMode.ts` and cache code use raw localStorage keys.
- API client/socket connection still contain direct token fallback logic.

## Component syntax flaws

### 1. Large wall-of-JSX components

Several files contain long render trees with deeply nested JSX, long Tailwind strings, inline style objects, animation props, and conditional branches. This makes the visual output possible to tweak, but the code difficult to scan.

Most affected:

- `QueueList.tsx`
- `ConnectedUsers.tsx`
- `ActionButtons.tsx`
- `SettingsUI.tsx`

### 2. Mode flags create two apps inside one component

`mode: 'attendee' | 'dj'` is passed through many components. Some shared components are reasonable, but many files now carry two behavioral models at once.

Better shape:

- `AttendeeDashboard`
- `DjDashboard`
- `AttendeeQueue`
- `DjQueue`
- `AttendeeSongSuggestView`
- `DjSongApprovalView`

Then extract genuinely shared UI pieces underneath.

### 3. Inline styling and embedded CSS are overused

The codebase relies heavily on raw Tailwind strings, inline style objects, and embedded `<style>` blocks inside components. This is especially visible in gesture/animation UI.

This creates noisy components and makes design changes hard to apply consistently.

### 4. Prop lists are too broad

Several components receive many primitive props instead of a narrow view model or smaller composed subcomponents. Long prop lists make component contracts harder to understand and increase churn when data shape changes.

### 5. Defensive `memo` aliases add noise

`Dashboard.tsx` wraps imported components in local `memo()` aliases. Unless profiling proves those wrappers matter, they are mostly noise and do not fix the underlying render causes.

## TypeScript flaws

### 1. Type suppressions exist in service code

`@ts-ignore` in API/socket service files is a warning sign. The service boundary should be among the most strongly typed parts of the frontend.

## Design-system flaws

Only a tiny `components/ui` layer exists, while most real UI styling lives in feature components. This means the app has visual styling but not a strong reusable design system.

Symptoms:

- Repeated layout/card/button styling.
- Long Tailwind strings in business components.
- Inconsistent ownership of animation and visual variants.
- Harder future redesigns.

## Routing/navigation flaws

`AppRoutes.tsx` contains special overlay behavior for keeping Dashboard mounted behind SongSelection. This may be intentional, but it is surprising and duplicates route concerns. It should be documented or moved into an explicit dashboard workspace route/layout.

## Debug tooling flaws

The debug modal is dev-only loaded, which is good. However, debug behavior remains large, complex, and close to production component patterns.

## Recommended refactor order

1. Replace remaining raw socket/debug `any` handlers with typed payloads and normalization at the boundary.
2. Reduce mode branching by introducing attendee/DJ-specific feature shells.
3. Gradually extract repeated Tailwind patterns into shared UI primitives where it removes real duplication.

## What not to do

- Do not rewrite the whole frontend at once.
- Do not add abstractions only to make folders look cleaner.
- Do not move files without reducing responsibilities.
- Do not trust localStorage/session data for permission decisions; backend remains source of truth.
- Do not scatter new socket compatibility code into components; normalize once at the boundary.
