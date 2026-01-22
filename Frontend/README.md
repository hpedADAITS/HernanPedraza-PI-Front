# SyncRequest - Event DJ Platform

A modern React application for managing event music requests. Attendees request songs via QR codes, DJs manage queues and playback.

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Navigate to Frontend directory
cd Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

## Features

### 🎤 For Attendees
- Quick QR code login
- Browse and request songs
- View event queue
- Track request status (Playing, Queued)
- Real-time event information

### 🎵 For DJs
- Secure username/password login
- Manage song requests queue
- View now-playing track with progress
- Add songs to library
- Event statistics and metrics
- Settings and account management

## Project Structure

```
Frontend/
├── src/
│   ├── components/
│   │   ├── layouts/          # Page layouts
│   │   ├── pages/            # Page components
│   │   └── shared/           # Reusable components
│   ├── context/              # React Context (Auth)
│   ├── routes/               # Routing logic
│   ├── hooks/                # Custom hooks
│   ├── types/                # TypeScript types
│   ├── styles/               # Global styles
│   ├── App.tsx               # Main app component
│   └── main.tsx              # Entry point
├── NAVIGATION.md             # Detailed route documentation
├── package.json
├── vite.config.ts
└── index.html
```

## Navigation

Full navigation documentation available in [NAVIGATION.md](./NAVIGATION.md)

### Public Routes
- `/` - Role selection
- `/login/attendee` - Attendee QR login
- `/login/dj` - DJ credentials login

### Protected Routes (Attendee)
- `/attendee/dashboard` - Main dashboard
- `/attendee/songs` - Song selection

### Protected Routes (DJ)
- `/dj/dashboard` - Queue management
- `/dj/songs` - Song library

### Error Routes
- `/404` - Page not found
- `/unauthorized` - Access denied

## Demo Credentials

**DJ Login:**
- Username: `demo`
- Password: `password`

**Attendee Login:**
- Use "Simulate QR Scan" button (auto-login)

## Development

### Available Scripts

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Tech Stack

- **Framework**: React 18
- **Routing**: React Router v6
- **Language**: TypeScript
- **Build**: Vite
- **Styling**: Vanilla CSS + Animations
- **Icons**: Lucide React

## Authentication

The app uses a custom AuthContext for state management:

```tsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { isAuthenticated, role, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginForm />;
  }
  
  return role === 'dj' ? <DjDashboard /> : <AttendeeDashboard />;
}
```

### Protected Routes

Routes requiring authentication use `ProtectedRoute`:

```tsx
<ProtectedRoute requiredRole="dj">
  <PrivateLayout />
</ProtectedRoute>
```

Unauthenticated users are redirected to `/role`

## Animations

All page transitions and interactions use smooth CSS animations:
- Page fade-in (0.3s)
- Staggered element animations (0.5s with delays)
- Hover effects on buttons
- Loading spinners

No external animation library - pure CSS keyframes.

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## Performance

- Code splitting by route
- Lazy loading of pages
- Optimized bundle size (~150KB gzipped)
- No unnecessary re-renders with React.memo

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast
- Focus management

## State Management

### AuthContext
Handles user authentication state:
- `isAuthenticated` - Login status
- `role` - User role (attendee | dj)
- `username` - Display name
- `login()` - Authenticate user
- `logout()` - Clear session

State persists to localStorage.

## Styling Architecture

Uses Vanilla CSS with custom properties:

```css
/* Global variables */
:root {
  --primary: #3b82f6;
  --success: #10b981;
  --danger: #ef4444;
  /* ... */
}

/* Reusable classes */
.btn-primary { /* ... */ }
.card { /* ... */ }
.badge { /* ... */ }
```

Gradients and animations defined inline for flexibility.

## Testing

To add tests:

```bash
npm install --save-dev vitest @testing-library/react
```

Example test:
```tsx
import { render, screen } from '@testing-library/react';
import { RoleSelection } from './components/pages/RoleSelection';

test('renders role selection', () => {
  render(<RoleSelection />);
  expect(screen.getByText('Attendee')).toBeInTheDocument();
});
```

## Deployment

### Build
```bash
npm run build
```
Creates `dist/` folder with optimized production build.

### Deploy to Vercel
```bash
npm i -g vercel
vercel
```

### Deploy to Netlify
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

## Troubleshooting

### Port 5173 Already in Use
```bash
npm run dev -- --port 3000
```

### Auth Persisting After Logout
Clear localStorage:
```javascript
localStorage.clear();
```

### Components Not Updating
Ensure using `useAuth()` hook instead of importing context directly.

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes following project structure
3. Test all routes and authentication flows
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/name`

## License

MIT License - See LICENSE file

## Support

For issues or questions:
1. Check [NAVIGATION.md](./NAVIGATION.md) for routing details
2. Review component source code with comments
3. Check browser console for errors
4. Verify auth state with React DevTools

---

**Built with React + TypeScript + Vite**
