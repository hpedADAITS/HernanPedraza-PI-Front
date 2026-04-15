import { apiCall } from './client';

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
