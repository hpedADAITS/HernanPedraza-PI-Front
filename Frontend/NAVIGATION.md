# Navigation Architecture Documentation

## Overview

This document maps the SyncRequest application's route architecture, connecting Figma design screens to implemented React routes, layouts, and authentication states.

## Route Map

### Public Routes (No Authentication)

| Route | Screen Name | Description | Figma Link | State |
|-------|-------------|-------------|-----------|-------|
| `/` | Role Selection | Users choose between Attendee or DJ | Design → [Figma] | ✅ Implemented |
| `/role` | Role Selection (Deep Link) | Alternative entry to role selection | Design → [Figma] | ✅ Implemented |
| `/login/attendee` | Attendee Login | QR code scanning for attendee entry | Design → [Figma] | ✅ Implemented |
| `/login/dj` | DJ Login | Username/password authentication for DJs | Design → [Figma] | ✅ Implemented |

### Attendee Protected Routes

| Route | Screen Name | Description | Figma Link | State |
|-------|-------------|-------------|-----------|-------|
| `/attendee/dashboard` | Attendee Dashboard | Main hub showing event info, requested songs, queue | Design → [Figma] | ✅ Implemented |
| `/attendee/songs` | Song Selection | Browse and request songs | Design → [Figma] | ✅ Implemented |
| `/attendee/profile` | Attendee Profile | Profile management (planned) | Design → [Figma] | 📋 Planned |

### DJ Protected Routes

| Route | Screen Name | Description | Figma Link | State |
|-------|-------------|-------------|-----------|-------|
| `/dj/dashboard` | DJ Dashboard | Queue management, now-playing track, statistics | Design → [Figma] | ✅ Implemented |
| `/dj/songs` | Song Library | Browse and manage song library | Design → [Figma] | ✅ Implemented |
| `/dj/settings` | DJ Settings | Event and playback settings | Design → [Figma] | 📋 Planned |
| `/dj/settings/account` | Account Settings | Account management | Design → [Figma] | 📋 Planned |
| `/dj/queue` | Queue Management | Detailed queue view (planned) | Design → [Figma] | 📋 Planned |

### Error Routes

| Route | Screen Name | Description | Figma Link | State |
|-------|-------------|-------------|-----------|-------|
| `/404` | Not Found | 404 error page | Design → [Figma] | ✅ Implemented |
| `/unauthorized` | Unauthorized | Access denied page | Design → [Figma] | ✅ Implemented |
| `*` | Catch-all | Redirects to `/404` | - | ✅ Implemented |

## Navigation Flows

### Authentication Flow

```
/ (Role Selection)
├── /login/attendee (QR Scan)
│   └── /attendee/dashboard (Authenticated)
└── /login/dj (Credentials)
    └── /dj/dashboard (Authenticated)
```

### Attendee Flow

```
/attendee/dashboard
├── /attendee/songs (Request songs)
├── /attendee/profile (View profile)
└── Logout → /role
```

### DJ Flow

```
/dj/dashboard
├── /dj/songs (Manage library)
├── /dj/settings (Configure event)
│   └── /dj/settings/account (Account)
├── /dj/queue (View queue)
└── Logout → /role
```

## Architecture Decisions

### 1. Layout Structure

**PublicLayout** - For unauthenticated routes
- No header navigation
- Full-screen backgrounds
- Role selection and login forms
- Error pages

**PrivateLayout** - For authenticated routes
- Header with navigation (Home, Settings)
- Logout button
- Sidebar navigation (extensible)
- Context-aware UI based on role

### 2. Protected Routes

Routes requiring authentication use `ProtectedRoute` wrapper:

```tsx
<Route
  element={
    <ProtectedRoute requiredRole="dj">
      <PrivateLayout />
    </ProtectedRoute>
  }
>
  <Route path="/dj/dashboard" element={<DjDashboard />} />
</Route>
```

Behavior:
- Not authenticated → Redirects to `/role`
- Wrong role → Redirects to `/unauthorized`
- Correct role → Renders component

### 3. Authentication State Management

**AuthContext** provides:
- `isAuthenticated` - Boolean login state
- `role` - 'attendee' | 'dj'
- `username` - Display name
- `login(role, username)` - Set auth state
- `logout()` - Clear auth state

Persists to localStorage for session recovery.

### 4. Screen States

Each screen implements states:
- **Loading** - Data fetching (spinner, skeleton)
- **Error** - Failed operations (error banner, retry button)
- **Empty** - No data (empty state, helpful message)
- **Success** - Normal display

Example:
```tsx
{isLoading && <Spinner />}
{error && <ErrorBanner message={error} />}
{data?.length === 0 && <EmptyState />}
{data && <ContentDisplay />}
```

### 5. Animations

All pages use **CSS keyframe animations** (Vanilla React):
- `fadeIn` - Page entrance (0.3s)
- `fadeInUp` - Element stagger (0.5s, variable delay)
- `slideIn` - Modal/drawer entrance
- `pulse` - Loading indicators

No external animation library dependency.

## Folder Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── layouts/          # PublicLayout, PrivateLayout
│   │   ├── pages/            # Page components
│   │   └── shared/           # Reusable components (PageTransition, AnimatedButton)
│   ├── context/              # AuthContext
│   ├── routes/               # Route config, ProtectedRoute, routeMap
│   ├── hooks/                # usePageTransition, etc.
│   ├── types/                # TypeScript interfaces
│   ├── styles/               # Global CSS
│   ├── App.tsx               # Route definitions
│   └── main.tsx              # Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## Authentication Details

### Demo Credentials (Development)

**DJ Login:**
- Username: `demo`
- Password: `password`

**Attendee Login:**
- Click "Simulate QR Scan" button (auto-logs in)

### Session Persistence

Auth state is saved to localStorage:
```javascript
localStorage.getItem('auth') // Returns { role, username }
```

On refresh, the auth state persists, but you'll need to restore it from localStorage if implementing deeper persistence.

## Screen Coverage Checklist

### Implemented ✅
- [x] Role Selection
- [x] Attendee Login (QR)
- [x] DJ Login (Form)
- [x] Attendee Dashboard
- [x] DJ Dashboard
- [x] Song Selection (Both roles)
- [x] 404 Error Page
- [x] Unauthorized Page
- [x] Navigation Header

### Planned 📋
- [ ] Attendee Profile
- [ ] DJ Settings
- [ ] DJ Account Settings
- [ ] DJ Queue Management (detail view)
- [ ] Song Details / Info Modal
- [ ] Request History

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd Frontend
   npm install
   ```

2. **Start Dev Server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5173`

3. **Build for Production**
   ```bash
   npm run build
   ```

## Testing Navigation

### Test Case: Attendee Flow
1. Navigate to `/` (Role Selection)
2. Click "Attendee" card → `/login/attendee`
3. Click "Simulate QR Scan" → Authenticates to `/attendee/dashboard`
4. Click "Request a Song" → `/attendee/songs`
5. Click "Logout" → `/role`

### Test Case: DJ Flow
1. Navigate to `/role`
2. Click "DJ" card → `/login/dj`
3. Enter `demo` / `password` → `/dj/dashboard`
4. Click "Add Songs" → `/dj/songs`
5. Click "Settings" → `/dj/settings` (planned)

### Test Case: Protected Routes
1. Try accessing `/attendee/dashboard` without auth → Redirects to `/role`
2. Login as DJ, try `/attendee/dashboard` → `/unauthorized`
3. Try `/invalid-route` → `/404`

## Technical Stack

- **React 18** - UI library
- **React Router v6** - Client-side routing
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Vanilla CSS** - Styling + animations (no Tailwind in this version)
- **Lucide Icons** - Icon library

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Future Enhancements

1. **API Integration** - Replace mock data with real endpoints
2. **WebSocket Support** - Real-time queue updates
3. **Mobile Optimization** - Responsive tweaks
4. **State Management** - Redux/Zustand for complex state
5. **Component Library** - Extract reusable UI components
6. **Testing** - Unit and E2E tests
7. **Accessibility** - WCAG 2.1 compliance

## Contact & Support

For questions about navigation structure or implementation, refer to the codebase:
- Route definitions: `src/App.tsx`
- Route config: `src/routes/routeMap.ts`
- Auth context: `src/context/AuthContext.tsx`
