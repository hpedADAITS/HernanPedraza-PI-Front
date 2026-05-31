import type { Song, SongStatus } from '@/types/songs';

export interface SongEventPayload {
  songId?: string;
  id?: string;
  _id?: string;
  title?: string;
  artist?: string;
  voteScore?: number;
  status?: SongStatus | string;
  totalDuration?: number;
  duration?: number;
  queuePosition?: number;
  requestedBy?: Song['requestedBy'];
  eventId?: string;
  reason?: string;
  playingStartedAt?: string;
  startedPlayingAt?: string;
}

export interface NowPlayingEventPayload extends SongEventPayload {
  elapsedTime?: number;
  remainingTime?: number;
}

export interface QueueUpdatedPayload {
  queue?: Song[];
  nowPlaying?: NowPlayingEventPayload | null;
}

export interface VotesUpdatedPayload {
  songId?: string;
  voteScore?: number;
  affectedSongs?: Array<{
    songId?: string;
    _id?: string;
    id?: string;
    queuePosition?: number;
  }>;
}

export interface NormalizedNowPlaying {
  songId: string;
  title: string;
  artist: string;
  duration: number;
  totalDuration?: number;
  startedAt: number;
  elapsedTime?: number;
}
