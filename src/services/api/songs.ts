import { apiCall } from './client';
import type { Song } from '@/types/songs';
import type { AudioTrack } from './audioTracks';

// Regex for valid MongoDB ObjectId (24 hex characters)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function validateObjectId(id: string, name: string): void {
  if (!id || !OBJECT_ID_REGEX.test(id)) {
    throw new Error(`Invalid ${name} ID format: ${id}`);
  }
}

export const songsAPI = {
  lookupMusicBrainz: async (
    eventId: string,
    participantId: string,
    title: string,
    artist: string,
    totalDuration?: number,
  ): Promise<Song['recognitionMatch'][]> => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/lookup-musicbrainz`, {
      method: 'POST',
      body: JSON.stringify({ participantId, title, artist, totalDuration }),
    });
    return data.data.matches ?? (data.data.match ? [data.data.match] : []);
  },

  getMusicBrainzMatchCandidates: async (
    eventId: string,
    songId: string,
  ): Promise<{ song: Song; musicBrainz: Song['recognitionMatch']; tracks: AudioTrack[] }> => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/musicbrainz-match-candidates`);
    return data.data;
  },

  getFingerprintMatchCandidates: async (
    eventId: string,
    songId: string,
  ): Promise<{
    song: Song;
    target: { title: string; artist: string };
    recognitionMatch: Song['recognitionMatch'] | null;
    tracks: (AudioTrack & {
      matchScore: number;
      titleScore?: number;
      artistScore?: number;
      matchedOn?: string;
    })[];
  }> => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/fingerprint-match-candidates`);
    return data.data;
  },

  searchFingerprints: async (
    eventId: string,
    participantId: string,
    title: string,
    artist: string,
  ): Promise<{
    matches: Array<{
      trackId: string;
      title: string;
      artist: string;
      coverUrl: string | null;
      duration: number | null;
      matchScore: number;
      titleScore: number;
      artistScore: number;
      matchedOn: string;
    }>;
    query: { title: string; artist: string };
  }> => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/search-fingerprints`, {
      method: 'POST',
      body: JSON.stringify({ participantId, title, artist }),
    });
    return data.data;
  },

  assignMusicBrainzTrack: async (
    eventId: string,
    songId: string,
    trackId: string,
  ): Promise<{ song: Song; track: AudioTrack }> => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    validateObjectId(trackId, 'trackId');
    const data = await apiCall(`/songs/${eventId}/${songId}/assign-musicbrainz-track`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
    return data.data;
  },

  assignFingerprint: async (
    eventId: string,
    songId: string,
    trackId: string,
  ): Promise<{ song: Song }> => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    validateObjectId(trackId, 'trackId');
    const data = await apiCall(`/songs/${eventId}/${songId}/assign-fingerprint`, {
      method: 'POST',
      body: JSON.stringify({ trackId }),
    });
    return data.data;
  },

  suggestSong: async (
    eventId: string,
    participantId: string,
    title: string,
    artist: string,
    totalDuration?: number,
    options?: {
      musicBrainzConfirmed?: boolean;
      musicBrainzMatch?: Song['recognitionMatch'];
      skipMusicBrainzLookup?: boolean;
    },
  ) => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/suggest`, {
      method: 'POST',
      body: JSON.stringify({ participantId, title, artist, totalDuration, ...options }),
    });
    return data.data.song;
  },

  getQueue: async (eventId: string) => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/queue`);
    return data.data.queue;
  },

  getPendingSongs: async (eventId: string) => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/pending`);
    return data.data.pending;
  },

  approveSong: async (eventId: string, songId: string) => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/approve`, {
      method: 'POST',
    });
    return data.data.song;
  },

  sendNow: async (eventId: string, songId: string) => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/send-now`, {
      method: 'POST',
    });
    return data.data.song;
  },

  rejectSong: async (eventId: string, songId: string, reason: string) => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.song;
  },

  playNext: async (eventId: string) => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/play-next`, {
      method: 'POST',
    });
    return data.data.song;
  },

  skipSong: async (eventId: string, songId: string, reason: string) => {
    validateObjectId(eventId, 'eventId');
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${eventId}/${songId}/skip`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.song;
  },

  getSongPosition: async (songId: string) => {
    validateObjectId(songId, 'songId');
    const data = await apiCall(`/songs/${songId}/position`);
    return data.data;
  },
};
