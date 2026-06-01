# Frontend flaws audit

This document records the main structural and code-quality flaws in the React/TypeScript frontend. It focuses on architecture, boundaries, and maintainability, not whether the current build passes.

## Executive summary

The frontend works, but too much behavior still lives in route pages and large dashboard components. Session reads, socket handling, payload normalization, localStorage migration, error handling, and UI rendering are still too often mixed in the same file. That makes the code hard to reason about, easy to regress, and slow to evolve.

## Highest-risk surfaces

- `src/pages/SongSelection.tsx` - owns both attendee song suggestions and DJ pending-song decisions.
- `src/components/dashboard/QueueList.tsx` - queue rendering plus realtime state and interaction logic.
- `src/components/dashboard/ConnectedUsers.tsx` - participant/admin UI mixed with moderation and socket behavior.
- `src/components/dashboard/ActionButtons.tsx` - navigation, modal flow, and socket-driven actions in one component.
- `src/components/dashboard/NowPlayingSection.tsx` - display and realtime state are still coupled.
- `src/pages/DJRegister.tsx` - route-level registration flow remains too large.
- `src/pages/DJLogin.tsx` - login flow is still too coupled to global event selection.
- `src/components/debug/SongCardDebugModal.tsx` - debug UI is complex enough to keep bleeding into production patterns.

## Structural flaws

### 1. Feature ownership is still blurred

The app has `pages`, `components`, `hooks`, `services`, `utils`, and `types`, but feature boundaries are not consistent. Dashboard logic is split across route pages, dashboard components, socket services, session services, and utilities, with too much orchestration still happening in UI files.

The durable direction is feature ownership by domain, not by file type:

- dashboard
- song-selection
- realtime
- session
- settings

Each feature should own its UI, controller hooks, local types, and adapters where that removes duplication or risk.

### 2. Route pages still do too much

Pages should mostly compose layout and feature shells. Several pages still contain real business logic, flow control, or state orchestration that should live below the route layer.

### 3. Dashboard components act like controllers

Many dashboard components still read session state, call APIs, subscribe to sockets, normalize payloads, compute derived state, and render UI in one place. That makes component reuse and testing harder because the side effects are inseparable from rendering.

### 4. Realtime boundaries are leaky

Normalization exists in `src/services/socket/normalize.ts`, which is the right place, but raw payload compatibility still leaks into UI code in too many spots. Debug song events and production socket events should stay normalized at the boundary, not handled ad hoc in components.

### 5. Session and storage boundaries are inconsistent

Typed session access exists in `src/services/session.ts`, but UI code still reaches into storage too directly in places. LocalStorage should remain cache or display state only; identity and permission decisions must stay server-side.

## Component syntax flaws

### 1. Large wall-of-JSX components

Several files still mix long render trees, conditional branches, gesture logic, and dense Tailwind strings. The result is visually expressive but hard to scan and expensive to change.

### 2. Mode branching creates two apps in one tree

The attendee and DJ experiences still share components that carry too many behavioral branches. Shared UI is fine; shared controllers with `mode`-driven branching are where complexity accumulates.

### 3. Styling is embedded instead of composed

The app still relies heavily on raw Tailwind strings and inline styling inside business components. That keeps changes local, but it also duplicates layout patterns and makes design changes harder to apply consistently.

### 4. Prop contracts are too wide

Some components still receive broad prop lists instead of narrower view models or smaller subcomponents. That increases churn and makes ownership harder to see.

## TypeScript flaws

### 1. Type suppressions are a smell at service boundaries

`@ts-ignore` in API or socket service code should be treated as technical debt. These boundaries should be among the most strictly typed parts of the frontend.

### 2. Socket handlers should stay typed once

New event handlers should use explicit payload types and normalization at the boundary. Avoid spreading `any` or compatibility parsing through components.

## Design-system flaws

The UI layer is still too thin for the amount of repeated dashboard and settings UI. There are repeated card, button, layout, and state patterns, but not enough shared primitives to keep those patterns consistent without copying.

Symptoms:

- repeated Tailwind-heavy layout code
- inconsistent animation and variant ownership
- duplicated settings and dashboard patterns
- visual changes requiring edits in multiple feature components

## Routing and navigation flaws

`AppRoutes.tsx` still carries special overlay behavior to keep the dashboard mounted behind song selection. That may be intentional, but it is non-obvious route behavior and should stay explicit and documented.

## Debug tooling flaws

Debug tooling is correctly dev-only loaded, but it remains close to production component patterns and too complex to be treated as a throwaway surface. It should stay isolated from normal UI behavior and avoid introducing new compatibility habits.

## Priorities

1. Keep socket, session, and storage normalization at the boundary.
2. Split the biggest route-page controllers into feature shells and narrower controllers.
3. Reduce attendee/DJ branching by extracting separate feature flows where the behavior diverges.
4. Extract shared UI primitives only where they remove real duplication.

## Non-goals

- Do not rewrite the whole frontend at once.
- Do not move files just to make the tree look cleaner.
- Do not add abstractions that only rename the current mess.
- Do not trust localStorage or session cache for permission decisions.
- Do not scatter socket compatibility code through components.
- Do not mix unrelated refactors into a narrow fix.
