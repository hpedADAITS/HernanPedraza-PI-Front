import type { View } from '@/types';

export const viewPaths: Record<View, string> = {
  'role-selection': '/',
  'attendee-login': '/attendee/login',
  'dj-login': '/dj/login',
  'dj-register': '/dj/register',
  'attendee-dashboard': '/attendee/dashboard',
  'dj-dashboard': '/dj/dashboard',
  'attendee-song-select': '/attendee/songs',
  'dj-song-select': '/dj/songs',
  'attendee-settings': '/attendee/settings',
  'attendee-account-settings': '/attendee/settings/account',
  'attendee-app-settings': '/attendee/settings/app',
  'dj-settings': '/dj/settings',
  'dj-account-settings': '/dj/settings/account',
  'dj-app-settings': '/dj/settings/app',
  'dj-phone-microphone': '/dj/microphone',
  'verify-email': '/verify-email',
};

export function getViewPath(view: View) {
  return viewPaths[view];
}

export function getViewFromPath(pathname: string): View {
  if (pathname.startsWith('/verify-email')) {
    return 'verify-email';
  }

  if (pathname.startsWith('/dj/microphone')) {
    return 'dj-phone-microphone';
  }

  return (
    Object.entries(viewPaths).find(([, path]) => path === pathname)?.[0] ??
    'role-selection'
  ) as View;
}
