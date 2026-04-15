import { apiCall } from './client';

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
