/**
 * Application routes and navigation constants
 */

export const ROUTES = {
  // Main navigation views
  ROLE_SELECTION: 'role-selection' as const,
  ATTENDEE_LOGIN: 'attendee-login' as const,
  DJ_LOGIN: 'dj-login' as const,
  ATTENDEE_DASHBOARD: 'attendee-dashboard' as const,
  DJ_DASHBOARD: 'dj-dashboard' as const,
  ATTENDEE_SONG_SELECT: 'attendee-song-select' as const,
  DJ_SONG_SELECT: 'dj-song-select' as const,
  DJ_SETTINGS: 'dj-settings' as const,
  DJ_ACCOUNT_SETTINGS: 'dj-account-settings' as const,
} as const;

/**
 * Route groups for navigation logic
 */
export const ROUTE_GROUPS = {
  LOGIN: ['attendee-login', 'dj-login'],
  DASHBOARD: ['attendee-dashboard', 'dj-dashboard'],
  SONG_SELECT: ['attendee-song-select', 'dj-song-select'],
  DJ: [
    'dj-login',
    'dj-dashboard',
    'dj-song-select',
    'dj-settings',
    'dj-account-settings',
  ],
  ATTENDEE: ['attendee-login', 'attendee-dashboard', 'attendee-song-select'],
} as const;

/**
 * Check if route requires authentication
 */
export function requiresAuth(route: string): boolean {
  const publicRoutes = ['role-selection', 'attendee-login', 'dj-login'];
  return !publicRoutes.includes(route);
}

/**
 * Check if route is DJ-only
 */
export function isDjRoute(route: string): boolean {
  return ROUTE_GROUPS.DJ.includes(route as any);
}

/**
 * Check if route is attendee-only
 */
export function isAttendeeRoute(route: string): boolean {
  return ROUTE_GROUPS.ATTENDEE.includes(route as any);
}
