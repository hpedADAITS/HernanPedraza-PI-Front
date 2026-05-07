export type SongStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PLAYING'
  | 'PLAYED'
  | 'REJECTED'
  | 'SKIPPED';

export interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: SongStatus | string;
  duration?: number;
  queuePosition?: number;
  approvedAt?: string;
  playingStartedAt?: string;
  requestedBy?: { _id: string; nickname: string } | null;
  eventId?: string;
  createdAt?: string;
}

export interface NowPlayingMeta {
  songId: string;
  title: string;
  artist: string;
  duration: number;
  playingStartedAt: string;
  elapsedTime?: number;
  remainingTime?: number;
}

export interface SongPositionData {
  queuePosition: number;
  status: SongStatus | string;
  timeUntilPlay: number;
  songsAhead: Song[];
  currentlyPlaying: Song & { elapsedTime?: number };
}
