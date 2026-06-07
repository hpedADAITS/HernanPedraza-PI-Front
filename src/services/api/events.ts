import { API_BASE, apiCall, getToken } from './client';

function getPublicFrontendOrigin() {
  if (typeof window === 'undefined') return '';

  const { hostname, origin } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return '';
  }

  return /^https?:\/\//i.test(origin) ? origin : '';
}

export const eventsAPI = {
  createEvent: async (name: string, description: string, startsAt: string, eventId?: string) => {
    const data = await apiCall('/events', {
      method: 'POST',
      body: JSON.stringify({ name, description, startsAt, eventId }),
    });
    return data.data.event;
  },

  listEvents: async (limit = 50, skip = 0) => {
    const data = await apiCall(`/events?limit=${limit}&skip=${skip}`);
    return data.data.events;
  },

  getMyActiveEvent: async () => {
    try {
      const data = await apiCall('/events/mine/active');
      return data.data.event;
    } catch (error) {
      if (error instanceof Error && error.message === 'Event not found') {
        return null;
      }
      throw error;
    }
  },

  getEvent: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}`);
    return data.data.event;
  },

  getEventByAccessCode: async (accessCode: string) => {
    const data = await apiCall(`/events/access/${accessCode}`);
    return data.data.event;
  },

  regenerateAccessCode: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}/regenerate-code`, {
      method: 'POST',
    });
    return data.data.event;
  },

  updateEvent: async (eventId: string, updates: Record<string, unknown>) => {
    const data = await apiCall(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data.event;
  },

  startEvent: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}/start`, {
      method: 'POST',
    });
    return data.data.event;
  },

  endEvent: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}/end`, {
      method: 'POST',
    });
    return data.data.event;
  },

  cancelEvent: async (eventId: string, reason: string) => {
    const data = await apiCall(`/events/${eventId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.event;
  },

  getParticipants: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}/participants`);
    return data.data.participants;
  },

  getPhoneMicrophoneLink: async (eventId: string) => {
    const publicOrigin = getPublicFrontendOrigin();
    const data = await apiCall(
      `/events/${eventId}/phone-microphone-link${
        publicOrigin ? `?frontendOrigin=${encodeURIComponent(publicOrigin)}` : ''
      }`,
    );
    return { link: data.data.link as string, token: data.data.token as string };
  },

  connectPhoneMicrophone: async (eventId: string, deviceName: string, token = '') => {
    const data = await apiCall(
      `/events/${eventId}/phone-microphone/connect`,
      {
        method: 'POST',
        body: JSON.stringify({ deviceName }),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return data.data.microphone;
  },

  sendMatchedAudioTrackNow: async (eventId: string, trackId: string, token = '') => {
    const data = await apiCall(
      `/events/${eventId}/audio-tracks/${trackId}/send-now`,
      {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    );
    return data.data.song;
  },

  matchAudio: async (eventId: string, audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.wav');

    const token = getToken();
    const response = await fetch(`${API_BASE}/events/${eventId}/audio-match`, {
      method: 'POST',
      body: formData,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to match audio: ${response.status}`);
    }

    const data = await response.json();
    return data.data.matches;
  },
};
