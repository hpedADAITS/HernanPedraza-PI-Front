# Frontend Project Structure

## Directory Organization

```
src/
├── assets/                 # Static assets (images, fonts, etc.)
├── components/
│   ├── ui/                # Reusable UI components (shadcn, custom)
│   │   ├── Logo.tsx
│   │   ├── NowPlaying.tsx
│   │   └── ...other UI components
│   ├── layout/            # Layout wrappers
│   │   └── Layout.tsx
│   └── figma/             # Figma-exported components (archived)
│       └── ImageWithFallback.tsx
├── pages/                 # Full page/route components (formerly "views")
│   ├── RoleSelection.tsx
│   ├── AttendeeLogin.tsx
│   ├── DjLogin.tsx
│   ├── Dashboard.tsx
│   ├── SongSelection.tsx
│   ├── Settings.tsx
│   ├── SettingsList.tsx
│   └── index.ts          # Barrel export
├── hooks/                # Custom React hooks (for future use)
├── utils/                # Utility functions (for future use)
├── constants/            # Constants and enums (for future use)
├── types/                # TypeScript type definitions
│   └── index.ts         # Shared types (View, UserRole, etc.)
├── styles/              # Global styles
│   └── ...existing styles
├── guidelines/          # Documentation
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global stylesheet
```

## Migration Notes

### Pages (formerly Views)
- All view files have been moved from `components/views/` → `pages/`
- Import paths updated from `../layout/Layout` → `../components/layout/Layout`
- Import paths updated from `../ui/Component` → `../components/ui/Component`

### Types
- Created centralized `types/index.ts` for shared type definitions
- Moved `View` type from `App.tsx` to `types/index.ts`
- Added `UserRole` and `PageProps` interface types

### Imports Folder
- Old Figma-exported components moved to `old_imports_backup/`
- Can be cleaned up or integrated into `components/figma/` if needed

## Best Practices

### Adding New Components
- **UI Components**: `src/components/ui/`
- **Layout Components**: `src/components/layout/`
- **Page-specific Components**: Consider creating `src/components/features/{featureName}/`

### Adding New Pages
- Create file in `src/pages/`
- Export from `src/pages/index.ts`
- Use typed imports from `src/types/`

### Imports
```typescript
// ✅ Good
import type { View } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { RoleSelection } from '@/pages';

// ❌ Avoid
import { RoleSelection } from '../../../pages/RoleSelection';
```

## Future Improvements
- Set up path aliases (`@/*`) in `tsconfig.json` and `vite.config.ts`
- Extract common logic into `hooks/` and `utils/`
- Add constants file for magic strings and configuration
- Organize components by feature if it grows
