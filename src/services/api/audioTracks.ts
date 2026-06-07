import { apiCall } from './client';
import {
  cachedCoverKeys,
  forgetTrackCover,
  hydrateTrackCover,
} from '@/services/cache/coverArtSessionCache';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  coverUrlCacheKey?: string | null;
  audioSha256?: string | null;
  duration: number;
  sampleRate: number;
  pointsCount: number;
  hashesCount: number;
  matchScore?: number;
  musicBrainzMetadataSha512?: string | null;
  musicBrainzRecordingId?: string | null;
  musicBrainzReleaseId?: string | null;
  metadataSourceSongId?: string | null;
}

export const audioTracksAPI = {
  uploadTrack: async (
    eventId: string,
    file: File,
    title: string,
    artist: string,
    coverUrl?: string,
  ) => {
    const body = new FormData();
    body.append('title', title);
    body.append('artist', artist);
    if (coverUrl?.trim()) body.append('coverUrl', coverUrl.trim());
    body.append('audio', file);
    const data = await apiCall(`/events/${eventId}/audio-tracks`, {
      method: 'POST',
      body,
      contentType: null,
    });
    return hydrateTrackCover(eventId, data.data.track as AudioTrack);
  },

  listTracks: async (eventId: string) => {
    const coverKeys = cachedCoverKeys(eventId);
    const query = coverKeys.length
      ? `?coverCacheKeys=${encodeURIComponent(coverKeys.join(','))}`
      : '';
    const data = await apiCall(`/events/${eventId}/audio-tracks${query}`);
    return (data.data.tracks as AudioTrack[]).map((track) =>
      hydrateTrackCover(eventId, track),
    );
  },

  deleteTrack: async (eventId: string, trackId: string) => {
    const data = await apiCall(`/events/${eventId}/audio-tracks/${trackId}`, {
      method: 'DELETE',
    });
    const track = data.data.track as AudioTrack;
    forgetTrackCover(eventId, track);
    return track;
  },
};
