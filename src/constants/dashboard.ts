export const PROFILE_IMAGE = new URL(
  '../assets/ProfilePicture.png',
  import.meta.url,
).href;

export const NOW_PLAYING = {
  id: 'default',
  title: 'No Song Playing',
  artist: 'Waiting for DJ to start',
  currentTime: '0:00',
  duration: '0:00',
  progress: 0,
  status: 'idle' as const,
};

export const THEME_CONFIG = {
  dj: {
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    primaryColor: 'bg-blue-600',
    accentColor: 'hover:bg-blue-700',
  },
  attendee: {
    gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    primaryColor: 'bg-emerald-600',
    accentColor: 'hover:bg-emerald-700',
  },
} as const;
