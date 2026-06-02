import { API_BASE } from './client';
import { getAuthToken } from '@/services/session';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  sampleRate: number;
  pointsCount: number;
  hashesCount: number;
}

async function authedFetch(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'API Error');
  return data;
}

export const audioTracksAPI = {
  uploadTrack: async (eventId: string, file: File, title: string, artist: string) => {
    const body = new FormData();
    body.append('title', title);
    body.append('artist', artist);
    body.append('audio', file);
    const data = await authedFetch(`/events/${eventId}/audio-tracks`, {
      method: 'POST',
      body,
    });
    return data.data.track as AudioTrack;
  },

  listTracks: async (eventId: string) => {
    const data = await authedFetch(`/events/${eventId}/audio-tracks`);
    return data.data.tracks as AudioTrack[];
  },

  deleteTrack: async (eventId: string, trackId: string) => {
    const data = await authedFetch(`/events/${eventId}/audio-tracks/${trackId}`, {
      method: 'DELETE',
    });
    return data.data.track as AudioTrack;
  },
};
