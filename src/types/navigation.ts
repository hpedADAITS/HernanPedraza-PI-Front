export type View =
  | 'role-selection'
  | 'attendee-login'
  | 'dj-login'
  | 'dj-register'
  | 'attendee-dashboard'
  | 'dj-dashboard'
  | 'attendee-song-select'
  | 'dj-song-select'
  | 'dj-settings'
  | 'dj-account-settings'
  | 'dj-app-settings';

export type UserRole = 'attendee' | 'dj';

export interface PageProps {
  onNavigate: (view: View) => void;
}

export interface DualModePageProps extends PageProps {
  mode: UserRole;
}
