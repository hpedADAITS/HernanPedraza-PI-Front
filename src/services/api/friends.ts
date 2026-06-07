import { apiCall } from './client';

export type FriendRequest = {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'denied' | 'cancelled';
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  fromUserId: string;
  toUserId: string;
  other: {
    id: string;
    displayName: string;
    profilePicture: string | null;
    role: string;
    emailRegistered: boolean;
  } | null;
};

export type Friend = {
  friendId: string;
  since: string;
  displayName: string;
  profilePicture: string | null;
  role: string;
  emailRegistered: boolean;
};

export type EventInvite = {
  id: string;
  direction: 'incoming' | 'outgoing';
  status: 'sent' | 'accepted' | 'dismissed' | 'expired';
  eventId: string | null;
  eventName: string | null;
  eventCode: string;
  message: string | null;
  sentAt: string;
  respondedAt: string | null;
  fromUserId: string;
  toUserId: string;
  other: {
    id: string;
    displayName: string;
    profilePicture: string | null;
    role: string;
    emailRegistered: boolean;
  } | null;
};

export const friendsAPI = {
  listFriends: async (): Promise<Friend[]> => {
    const data = await apiCall('/friends', { method: 'GET' });
    return data.data.friends || [];
  },

  unfriend: async (friendId: string) => {
    const data = await apiCall(`/friends/${friendId}`, { method: 'DELETE' });
    return data.data;
  },

  sendRequest: async (toUserId: string, message?: string) => {
    const data = await apiCall('/friends/requests', {
      method: 'POST',
      body: JSON.stringify({ toUserId, message }),
    });
    return data.data.request as FriendRequest;
  },

  listRequests: async (direction: 'incoming' | 'outgoing' = 'incoming') => {
    const data = await apiCall(`/friends/requests?direction=${direction}`, { method: 'GET' });
    return (data.data.requests || []) as FriendRequest[];
  },

  respondRequest: async (id: string, accept: boolean) => {
    const data = await apiCall(`/friends/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ accept }),
    });
    return data.data.request as FriendRequest;
  },

  cancelRequest: async (id: string) => {
    const data = await apiCall(`/friends/requests/${id}`, { method: 'DELETE' });
    return data.data.request as FriendRequest;
  },

  sendInvite: async (params: {
    friendId: string;
    eventCode: string;
    eventId?: string | null;
    eventName?: string | null;
    message?: string;
  }) => {
    const data = await apiCall('/friends/invites', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return data.data.invite as EventInvite;
  },

  listInvites: async (direction: 'incoming' | 'outgoing' = 'incoming') => {
    const data = await apiCall(`/friends/invites?direction=${direction}`, { method: 'GET' });
    return (data.data.invites || []) as EventInvite[];
  },

  respondInvite: async (id: string, accept: boolean) => {
    const data = await apiCall(`/friends/invites/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ accept }),
    });
    return data.data.invite as EventInvite;
  },
};
