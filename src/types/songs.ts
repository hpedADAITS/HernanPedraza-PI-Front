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
  downvoteCount?: number;
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
    trackId?: string;
    source?: 'local' | 'musicbrainz' | 'fingerprint';
    recordingId?: string | null;
    releaseId?: string | null;
    metadataSha512?: string | null;
    title: string;
    artist: string;
    coverUrl?: string | null;
    duration?: number | null;
    score: number;
    matchedOn: 'title' | 'artist' | 'title_artist' | 'lenient' | 'fingerprint';
    /** True when the match was supplied by the local fingerprint fallback
     *  (MusicBrainz returned no match / failed). */
    fallbackUsed?: boolean;
    /** Top candidates the DJ can pick from via the fingerprint picker. */
    alternates?: Array<{
      trackId: string;
      title: string;
      artist: string;
      coverUrl?: string | null;
      duration?: number | null;
      score: number;
      matchedOn: 'title' | 'artist' | 'title_artist' | 'lenient' | 'fingerprint';
    }>;
  } | null;
  eventId?: string;
  createdAt?: string;
  voteFlash?: 'up' | 'down';
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
