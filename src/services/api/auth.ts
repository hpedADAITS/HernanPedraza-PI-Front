import { apiCall, clearToken, saveToken } from './client';

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

  logout: async () => {
    try {
      const data = await apiCall('/auth/logout', {
        method: 'POST',
      });
      return data.data;
    } finally {
      clearToken();
    }
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

  updateProfilePicture: async (updates: { profilePicture: string | null }) => {
    const data = await apiCall('/auth/me/picture', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return data.data.user;
  },

  verifyEmailToken: async (token: string) => {
    const data = await apiCall(`/auth/verify-email/${token}`, {
      method: 'GET',
    });
    return data;
  },

  verifyEmail: async () => {
    const data = await apiCall('/auth/verify-email', {
      method: 'POST',
    });
    return data.data;
  },

  markTutorialAsSeen: async () => {
    const data = await apiCall('/auth/mark-tutorial-seen', {
      method: 'POST',
    });
    return data.data;
  },
};
