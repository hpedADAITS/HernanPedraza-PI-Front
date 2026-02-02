export const QUEUE_SONGS = [
  { title: 'Blinding Lights', artist: 'The Weeknd', votes: 42 },
  { title: 'Levitating', artist: 'Dua Lipa', votes: 38 },
  { title: 'Save Your Tears', artist: 'The Weeknd', votes: 25 },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa', votes: 19 }
] as const;

export const PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Crect fill='%235a7fa6' width='256' height='256'/%3E%3Ccircle cx='128' cy='96' r='48' fill='%23a8c5e0'/%3E%3Cpath d='M80 190c0-26 21-48 48-48s48 22 48 48v20H80z' fill='%23a8c5e0'/%3E%3C/svg%3E";

export const NOW_PLAYING = {
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  currentTime: '2:35',
  duration: '3:45',
  progress: 68,
  status: 'playing' as const
};

export const THEME_CONFIG = {
  dj: {
    gradient: 'bg-gradient-to-br from-blue-400 to-blue-600',
    primaryColor: 'bg-blue-600',
    accentColor: 'hover:bg-blue-700'
  },
  attendee: {
    gradient: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    primaryColor: 'bg-emerald-600',
    accentColor: 'hover:bg-emerald-700'
  }
} as const;
