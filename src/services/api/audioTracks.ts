import { apiCall } from './client';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  duration: number;
  sampleRate: number;
  pointsCount: number;
  hashesCount: number;
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
    return data.data.track as AudioTrack;
  },

  listTracks: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}/audio-tracks`);
    return data.data.tracks as AudioTrack[];
  },

  deleteTrack: async (eventId: string, trackId: string) => {
    const data = await apiCall(`/events/${eventId}/audio-tracks/${trackId}`, {
      method: 'DELETE',
    });
    return data.data.track as AudioTrack;
  },
};
