/**
 * ROUTE MAP - Navigation Architecture
 * Maps Figma screens to React routes with descriptions
 */

export const ROUTES = {
  // Public Routes (No Authentication Required)
  PUBLIC: {
    ROOT: '/',
    ROLE_SELECTION: '/role',
    ATTENDEE_LOGIN: '/login/attendee',
    DJ_LOGIN: '/login/dj',
  },
  
  // Attendee Routes (Protected)
  ATTENDEE: {
    DASHBOARD: '/attendee/dashboard',
    SONG_SELECTION: '/attendee/songs',
    SONG_DETAILS: '/attendee/songs/:id',
    PROFILE: '/attendee/profile',
  },
  
  // DJ Routes (Protected)
  DJ: {
    DASHBOARD: '/dj/dashboard',
    SONG_SELECTION: '/dj/songs',
    SONG_DETAILS: '/dj/songs/:id',
    SETTINGS: '/dj/settings',
    ACCOUNT_SETTINGS: '/dj/settings/account',
    QUEUE: '/dj/queue',
  },
  
  // Special Routes
  ERROR: {
    NOT_FOUND: '/404',
    UNAUTHORIZED: '/unauthorized',
  }
} as const;

/**
 * Route Metadata - Links to Figma screens and descriptions
 */
export const ROUTE_METADATA = {
  '/': {
    screen: 'Role Selection',
    description: 'User selects their role (Attendee or DJ)',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/role': {
    screen: 'Role Selection (Deep Link)',
    description: 'Role selection screen with two main options',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/login/attendee': {
    screen: 'Attendee Login',
    description: 'QR code scan login for attendees',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/login/dj': {
    screen: 'DJ Login',
    description: 'Username/password login for DJs',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/attendee/dashboard': {
    screen: 'Attendee Dashboard',
    description: 'Main dashboard showing current event and queue info',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/attendee/songs': {
    screen: 'Attendee Song Selection',
    description: 'Browse and request songs from the DJ',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/dj/dashboard': {
    screen: 'DJ Dashboard',
    description: 'DJ main dashboard with queue management',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/dj/songs': {
    screen: 'DJ Song Library',
    description: 'DJ manages their song library',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/dj/settings': {
    screen: 'DJ Settings',
    description: 'DJ event and playback settings',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/dj/settings/account': {
    screen: 'DJ Account Settings',
    description: 'Account management for DJ',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/404': {
    screen: 'Not Found',
    description: 'Error page for non-existent routes',
    figmaLink: 'https://www.figma.com/design/...',
  },
  '/unauthorized': {
    screen: 'Unauthorized',
    description: 'Error page for access denied',
    figmaLink: 'https://www.figma.com/design/...',
  },
};
