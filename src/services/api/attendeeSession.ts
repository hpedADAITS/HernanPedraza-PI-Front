import { apiCall, saveToken } from './client';

export const attendeeSessionAPI = {
  joinEvent: async (
    eventId: string,
    nickname: string,
    profilePicture?: string | null,
    password?: string,
  ) => {
    const data = await apiCall(`/attendee-session/events/${eventId}/join`, {
      method: 'POST',
      body: JSON.stringify({
        nickname,
        profilePicture: profilePicture || null,
        ...(password ? { password } : {}),
      }),
    });
    if (data.data.token) saveToken(data.data.token);
    return data.data;
  },
};
