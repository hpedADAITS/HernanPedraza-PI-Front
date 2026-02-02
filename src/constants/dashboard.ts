export const QUEUE_SONGS = [
  { title: 'Blinding Lights', artist: 'The Weeknd' },
  { title: 'Levitating', artist: 'Dua Lipa' },
  { title: 'Save Your Tears', artist: 'The Weeknd' },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa' }
] as const;

export const PROFILE_IMAGE = "https://images.unsplash.com/photo-1678286742832-26543bb49959?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0cmFpdCUyMHVzZXIlMjBwcm9maWxlfGVufDF8fHx8MTc2OTEyMTA2OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

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
