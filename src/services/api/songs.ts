import { apiCall } from './client';

// Regex for valid MongoDB ObjectId (24 hex characters)
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function validateObjectId(id: string, name: string): void {
  if (!id || !OBJECT_ID_REGEX.test(id)) {
    throw new Error(`Invalid ${name} ID format: ${id}`);
  }
}

export const songsAPI = {
  suggestSong: async (
    eventId: string,
    participantId: string,
    title: string,
    artist: string,
    totalDuration?: number,
  ) => {
    validateObjectId(eventId, 'eventId');
    const data = await apiCall(`/songs/${eventId}/suggest`, {
      method: 'POST',
      body: JSON.stringify({ participantId, title, artist, totalDuration }),
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
