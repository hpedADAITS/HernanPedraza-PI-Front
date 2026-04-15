// @ts-ignore
const VITE_API_URL = import.meta.env?.VITE_API_URL as string | undefined;
export const API_BASE: string = VITE_API_URL
  ? `${VITE_API_URL}/api/v1`
  : 'http://localhost:5000/api/v1';

let authToken: string | null = null;

// Retrieve token from localStorage
export function loadToken() {
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('authToken');
  }
}

// Store token in localStorage
export function saveToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

// Clear token
export function clearToken() {
  authToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// Helper to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API Error');
  }

  return response.json();
}

// Health check endpoint
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/ping/health`);
    if (!response.ok) {
      return { api: false, database: false };
    }
    return response.json();
  } catch {
    return { api: false, database: false };
  }
}

// ============ AUTH ENDPOINTS ============

export const authAPI = {
  register: async (
    email: string,
    password: string,
    displayName: string,
    role: string = 'ATTENDEE',
  ) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName, role }),
    });
    if (data.data.token) {
      saveToken(data.data.token);
    }
    return data.data;
  },

  login: async (email: string, password: string) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.data.token) {
      saveToken(data.data.token);
    }
    return data.data;
  },

  refreshToken: async (token: string) => {
    const data = await apiCall('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    if (data.data.token) {
      saveToken(data.data.token);
    }
    return data.data;
  },

  getCurrentUser: async () => {
    const data = await apiCall('/auth/me');
    return data.data.user;
  },

  updateProfile: async (updates: { displayName?: string }) => {
    const data = await apiCall('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.data.user;
  },

  updateProfilePicture: async (updates: { profilePicture: string }) => {
    const data = await apiCall('/auth/me/picture', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.data.user;
  },
};

// ============ EVENTS ENDPOINTS ============

export const eventsAPI = {
  createEvent: async (name: string, description: string, startsAt: string) => {
    const data = await apiCall('/events', {
      method: 'POST',
      body: JSON.stringify({ name, description, startsAt }),
    });
    return data.data.event;
  },

  listEvents: async (limit = 50, skip = 0) => {
    const data = await apiCall(`/events?limit=${limit}&skip=${skip}`);
    return data.data.events;
  },

  getEvent: async (eventId: string) => {
    const data = await apiCall(`/events/${eventId}`);
    return data.data.event;
  },

  getEventByAccessCode: async (accessCode: string) => {
    const data = await apiCall(`/events/access/${accessCode}`);
    return data.data.event;
  },

  updateEvent: async (eventId: string, updates: Record<string, any>) => {
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
};

// ============ PARTICIPANTS ENDPOINTS ============

export const participantsAPI = {
  joinEvent: async (eventId: string, nickname: string) => {
    const data = await apiCall(`/participants/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname }),
    });
    return data.data.participant;
  },

  leaveEvent: async (participantId: string) => {
    const data = await apiCall(`/participants/${participantId}/leave`, {
      method: 'POST',
    });
    return data.data.participant;
  },

  getParticipant: async (participantId: string) => {
    const data = await apiCall(`/participants/${participantId}`);
    return data.data.participant;
  },

  listEventParticipants: async (eventId: string) => {
    const data = await apiCall(`/participants/${eventId}/list`);
    return data.data.participants;
  },

  setPremium: async (participantId: string, isPremium: boolean) => {
    const data = await apiCall(`/participants/${participantId}/premium`, {
      method: 'PUT',
      body: JSON.stringify({ isPremium }),
    });
    return data.data.participant;
  },

  setCooldown: async (
    participantId: string,
    durationMs: number,
    reason: string,
  ) => {
    const data = await apiCall(`/participants/${participantId}/cooldown`, {
      method: 'POST',
      body: JSON.stringify({ durationMs, reason }),
    });
    return data.data.participant;
  },

  kickParticipant: async (participantId: string, reason: string) => {
    const data = await apiCall(`/participants/${participantId}/kick`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.participant;
  },
};

// ============ SONGS ENDPOINTS ============

export const songsAPI = {
  suggestSong: async (
    eventId: string,
    participantId: string,
    title: string,
    artist: string,
  ) => {
    const data = await apiCall(`/songs/${eventId}/suggest`, {
      method: 'POST',
      body: JSON.stringify({ participantId, title, artist }),
    });
    return data.data.song;
  },

  getQueue: async (eventId: string) => {
    const data = await apiCall(`/songs/${eventId}/queue`);
    return data.data.queue;
  },

  getPendingSongs: async (eventId: string) => {
    const data = await apiCall(`/songs/${eventId}/pending`);
    return data.data.pending;
  },

  approveSong: async (eventId: string, songId: string) => {
    const data = await apiCall(`/songs/${eventId}/${songId}/approve`, {
      method: 'POST',
    });
    return data.data.song;
  },

  rejectSong: async (eventId: string, songId: string, reason: string) => {
    const data = await apiCall(`/songs/${eventId}/${songId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.song;
  },

  skipSong: async (eventId: string, songId: string, reason: string) => {
    const data = await apiCall(`/songs/${eventId}/${songId}/skip`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return data.data.song;
  },

  getSongPosition: async (songId: string) => {
    const data = await apiCall(`/songs/${songId}/position`);
    return data.data;
  },
};

// ============ VOTES ENDPOINTS ============

export const votesAPI = {
  castVote: async (songId: string, participantId: string, value: number) => {
    const data = await apiCall('/votes', {
      method: 'POST',
      body: JSON.stringify({ songId, participantId, value }),
    });
    return data.data.vote;
  },

  removeVote: async (songId: string, participantId: string) => {
    const data = await apiCall(`/votes/${songId}/${participantId}`, {
      method: 'DELETE',
    });
    return data.data;
  },

  getVoteStats: async (eventId: string) => {
    const data = await apiCall(`/votes/${eventId}/stats`);
    return data.data;
  },

  getParticipantVote: async (songId: string, participantId: string) => {
    const data = await apiCall(`/votes/${songId}/${participantId}`);
    return data.data.vote;
  },
};

// Load token on module init
loadToken();
