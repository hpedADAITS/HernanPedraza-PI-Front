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

export type UserRole = 'attendee' | 'dj';

export interface PageProps {
  onNavigate: (view: View) => void;
}

export interface DualModePageProps extends PageProps {
  mode: UserRole;
}
