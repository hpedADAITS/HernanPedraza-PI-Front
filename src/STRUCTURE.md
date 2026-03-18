# Frontend Project Structure

## Directory Organization

```
src/
├── assets/                    # Static assets (images, logos)
│   ├── logo_normal.png
│   ├── logo_white.png
│   └── ProfilePicture.png
├── components/
│   ├── common/                # Custom reusable components (app-specific)
│   │   ├── Logo.tsx
│   │   └── NowPlaying.tsx
│   ├── dashboard/             # Dashboard feature components
│   │   ├── ActionButtons.tsx
│   │   ├── ConnectedUsers.tsx
│   │   ├── NowPlayingSection.tsx
│   │   ├── ParticipantsList.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── QRCodeModal.tsx
│   │   ├── QueueList.tsx
│   │   ├── SearchBar.tsx
│   │   └── index.ts
│   ├── error-boundary/        # Error handling components
│   │   ├── ErrorBoundary.tsx
│   │   ├── ErrorFallback.tsx
│   │   └── index.ts
│   ├── layout/                # Layout wrappers
│   │   └── Layout.tsx
│   ├── modals/                # Modal components
│   │   ├── FrequentSongWarningModal.tsx
│   │   └── index.ts
│   └── ui/                    # shadcn/ui primitives (auto-generated)
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...
├── constants/                 # Constants and configuration
│   ├── animations.ts
│   ├── dashboard.ts
│   ├── messages.ts
│   ├── routes.ts
│   └── songs.ts
├── hooks/                     # Custom React hooks
│   ├── index.ts               # Barrel export
│   ├── use-mobile.ts
│   ├── useAuth.ts
│   ├── useDarkMode.ts
│   ├── useEvents.ts
│   ├── useParticipants.ts
│   ├── useSongs.ts
│   └── useVotes.ts
├── lib/                       # Shared utilities (shadcn convention)
│   └── utils.ts               # cn() helper
├── pages/                     # Page/route components
│   ├── index.ts               # Barrel export
│   ├── AttendeeLogin.tsx
│   ├── Dashboard.tsx
│   ├── DjLogin.tsx
│   ├── NotFound.tsx
│   ├── RoleSelection.tsx
│   ├── Settings.tsx
│   ├── SettingsList.tsx
│   └── SongSelection.tsx
├── services/                  # API and socket communication
│   ├── api.ts                 # REST API client
│   └── socket.ts              # WebSocket client
├── styles/                    # Global styles and theming
│   └── globals.css            # shadcn CSS variables
├── types/                     # TypeScript type definitions
│   ├── index.ts               # Shared types (View, UserRole, PageProps)
│   └── lucide-react.d.ts
├── utils/                     # Application utilities
│   ├── index.ts               # Barrel export
│   ├── errors.ts
│   ├── formatting.ts
│   └── validation.ts
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
└── index.css                  # Tailwind base styles
```

## Conventions

### Path Aliases

All cross-directory imports use the `@/` alias (configured in `tsconfig.json` and `vite.config.ts`):

```typescript
// ✅ Correct
import { Logo } from '@/components/common/Logo';
import { Layout } from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import type { View } from '@/types';

// ❌ Avoid relative paths across directories
import { Logo } from '../../components/common/Logo';
```

### Component Organization

| Folder | Purpose |
|---|---|
| `components/ui/` | shadcn/ui primitives — do not add custom components here |
| `components/common/` | Reusable app-specific components (Logo, NowPlaying) |
| `components/dashboard/` | Components specific to the Dashboard feature |
| `components/layout/` | Layout wrappers |
| `components/modals/` | Modal/dialog components |
| `components/error-boundary/` | Error boundary components |

### Adding New Features

1. **New page**: Create in `pages/`, export from `pages/index.ts`
2. **New hook**: Create in `hooks/`, export from `hooks/index.ts`
3. **New feature components**: Create `components/{feature}/` with an `index.ts` barrel
4. **New utility**: Add to existing file in `utils/` or create a new one, export from `utils/index.ts`
