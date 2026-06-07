import type { AppMode, View } from '@/types';

const rolePath = (mode: AppMode, path: string) => `/${mode}${path}`;

export const viewPaths: Record<View, string> = {
  'role-selection': '/',
  'attendee-login': rolePath('attendee', '/login'),
  'dj-login': rolePath('dj', '/login'),
  'dj-register': '/dj/register',
  'attendee-dashboard': rolePath('attendee', '/dashboard'),
  'dj-dashboard': rolePath('dj', '/dashboard'),
  'attendee-song-select': rolePath('attendee', '/songs'),
  'dj-song-select': rolePath('dj', '/songs'),
  'attendee-settings': rolePath('attendee', '/settings'),
  'attendee-account-settings': rolePath('attendee', '/settings/account'),
  'attendee-app-settings': rolePath('attendee', '/settings/app'),
  'attendee-friends': rolePath('attendee', '/friends'),
  'dj-settings': rolePath('dj', '/settings'),
  'dj-account-settings': rolePath('dj', '/settings/account'),
  'dj-app-settings': rolePath('dj', '/settings/app'),
  'dj-phone-microphone': '/dj/microphone',
  banned: '/banned',
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
