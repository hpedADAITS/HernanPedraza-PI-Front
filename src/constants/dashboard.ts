export const QUEUE_SONGS = [
  { title: 'Blinding Lights', artist: 'The Weeknd', votes: 42 },
  { title: 'Levitating', artist: 'Dua Lipa', votes: 38 },
  { title: 'Save Your Tears', artist: 'The Weeknd', votes: 25 },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa', votes: 19 }
] as const;

export const PROFILE_IMAGE = new URL('../assets/ProfilePicture.png', import.meta.url).href;

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
