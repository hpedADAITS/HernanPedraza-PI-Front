export type View =
  | 'role-selection'
  | 'attendee-login'
  | 'dj-login'
  | 'dj-register'
  | 'attendee-dashboard'
  | 'dj-dashboard'
  | 'attendee-song-select'
  | 'dj-song-select'
  | 'attendee-settings'
  | 'attendee-account-settings'
  | 'attendee-app-settings'
  | 'dj-settings'
  | 'dj-account-settings'
  | 'dj-app-settings'
  | 'dj-phone-microphone'
  | 'banned'
  | 'verify-email';

export type NavigateToView = (view: View) => void;

export interface PageProps {
  onNavigate: NavigateToView;
}
