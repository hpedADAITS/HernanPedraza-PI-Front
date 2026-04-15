/**
 * View type for navigation between pages
 */
export type View =
  | 'role-selection'
  | 'attendee-login'
  | 'dj-login'
  | 'attendee-dashboard'
  | 'dj-dashboard'
  | 'attendee-song-select'
  | 'dj-song-select'
  | 'dj-settings'
  | 'dj-account-settings';

/**
 * User role type
 */
export type UserRole = 'attendee' | 'dj';

/**
 * Page props interface
 */
export interface PageProps {
  onNavigate: (view: View) => void;
}

/**
 * Mode-based page props (for pages that support both attendee and DJ modes)
 */
export interface DualModePageProps extends PageProps {
  mode: UserRole;
}
