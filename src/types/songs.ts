export type SongStatus =
  | 'PENDING'
  | 'APPROVED'
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
  voteCount?: number;
  status: SongStatus | string;
  totalDuration?: number;
  queuePosition?: number;
  approvedAt?: string;
  startedAt?: string | null;
  isPremiumSuggestion?: boolean;
  requestedBy?: {
    _id: string;
    nickname: string;
    profilePicture?: string | null;
    isPremium?: boolean;
    approvalCount?: number;
  } | null;
  recognitionMatch?: {
    trackId: string;
    title: string;
    artist: string;
    coverUrl?: string | null;
    score: number;
    matchedOn: 'title' | 'artist' | 'title_artist';
  } | null;
  eventId?: string;
  createdAt?: string;
}

export interface NowPlayingMeta {
  songId: string;
  title: string;
  artist: string;
  totalDuration?: number;
  startedAt: number;
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
