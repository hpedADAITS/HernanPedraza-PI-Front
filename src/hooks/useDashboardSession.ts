import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { NavigateToView } from '@/types';
import { disconnectSocket, initSocket, joinEvent, off, on, onAccessCodeUpdated, onEventEnded, onEventUpdated, onSongSuggested } from '@/services/socket';
import { eventsAPI } from '@/services/api';
import { clearStoredEvent, clearStoredParticipant, clearStoredUser, getAuthToken, getStoredEvent, getStoredParticipant, getStoredUser, setStoredEvent, setStoredParticipant } from '@/services/session';
import { isCurrentUserSessionActive, onCurrentUserSessionReplaced } from '@/services/singleUserSession';
import { toast } from 'sonner';
import { StoredEvent } from '@/services/session';

type DashboardMode = 'attendee' | 'dj';

export interface DashboardState {
  userName: string;
  profilePicture: string | null;
  djName: string;
  djProfilePicture: string | null;
  accessCode: string;
  eventId: string;
}

function updateStoredParticipantProfilePicture(newPicture: string) {
  const participant = getStoredParticipant();
  if (!participant) return;

  setStoredParticipant({
    ...participant,
    profilePicture: newPicture,
  });
}

function updateStoredEventAccessCode(newCode: string) {
  const eventData = getStoredEvent();
  if (!eventData) return;

  setStoredEvent({
    ...eventData,
    accessCode: newCode,
  });
}

function syncStoredEvent(eventData: StoredEvent, updates: Partial<StoredEvent>) {
  setStoredEvent({
    ...eventData,
    ...updates,
  });
}

function clearAttendeeEventSession() {
  disconnectSocket();
  clearStoredEvent();
  clearStoredParticipant();
}

function clearCurrentSession() {
  disconnectSocket();
  localStorage.removeItem('authToken');
  clearStoredUser();
  clearStoredEvent();
  clearStoredParticipant();
}

export function getInitialDashboardState(): DashboardState {
  const eventData = getStoredEvent();
  const participantData = getStoredParticipant();
  const user = getStoredUser();

  return {
    userName: user?.displayName || participantData?.nickname || 'User',
    profilePicture:
      participantData?.profilePicture ?? user?.profilePicture ?? null,
    djName: eventData?.ownerName || 'DJ',
    djProfilePicture: eventData?.ownerProfilePicture ?? null,
    accessCode: eventData?.accessCode || '',
    eventId: eventData?.eventId || '',
  };
}

interface UseDashboardSessionOptions {
  mode: DashboardMode;
  onNavigate: NavigateToView;
}

export function useDashboardSession({
  mode,
  onNavigate,
}: UseDashboardSessionOptions) {
  const isDj = mode === 'dj';
  const [dashboardState, setDashboardState] = useState<DashboardState>(
    getInitialDashboardState,
  );

  const navigateAway = useEffectEvent(() => {
    onNavigate(isDj ? 'dj-login' : 'attendee-login');
  });

  const leaveAttendeeEvent = useEffectEvent((message: string) => {
    if (isDj) return;

    toast.info(message);
    clearAttendeeEventSession();
    onNavigate('attendee-login');
  });

  const handleProfilePictureChange = useCallback((newPicture: string) => {
    setDashboardState((current) => ({
      ...current,
      profilePicture: newPicture,
    }));
    updateStoredParticipantProfilePicture(newPicture);
  }, []);

  const persistAccessCode = useCallback((newCode: string) => {
    setDashboardState((current) =>
      current.accessCode === newCode
        ? current
        : { ...current, accessCode: newCode },
    );
    updateStoredEventAccessCode(newCode);
  }, []);

  useEffect(() => {
    const eventData = getStoredEvent();
    const participantData = getStoredParticipant();
    const user = getStoredUser();

    if (!eventData || !participantData) {
      navigateAway();
      return;
    }

    if (!isCurrentUserSessionActive(user)) {
      clearCurrentSession();
      toast.info('This account is active in another window. Please log in again here to continue.');
      navigateAway();
      return;
    }

    const stopWatchingSession = onCurrentUserSessionReplaced(user, () => {
      clearCurrentSession();
      toast.info('This account was opened in another window. This session has been closed.');
      navigateAway();
    });

    const token = getAuthToken();
    const socket = initSocket(token ?? undefined);

    const handleConnect = async () => {
      try {
        if (!eventData.eventId || !participantData._id) {
          throw new Error('Session data is incomplete');
        }

        setDashboardState((current) => ({
          ...current,
          djName: eventData.ownerName || current.djName,
          djProfilePicture:
            eventData.ownerProfilePicture ?? current.djProfilePicture,
          eventId: eventData.eventId || current.eventId,
        }));

        const freshEvent = await eventsAPI.getEvent(eventData.eventId);
        if (freshEvent?.accessCode) {
          persistAccessCode(freshEvent.accessCode);
        }

        if (freshEvent?.ownerId?.profilePicture || freshEvent?.accessCode) {
          setDashboardState((current) => ({
            ...current,
            djProfilePicture:
              freshEvent.ownerId?.profilePicture ?? current.djProfilePicture,
            accessCode: freshEvent.accessCode || current.accessCode,
          }));
        }

        if (freshEvent?.ownerId?.profilePicture) {
          syncStoredEvent(eventData, {
            accessCode: freshEvent.accessCode || eventData.accessCode,
            ownerProfilePicture: freshEvent.ownerId.profilePicture,
          });
        }

        joinEvent(
          eventData.eventId,
          participantData._id,
          participantData.nickname || 'User',
          participantData.profilePicture || user?.profilePicture || null,
        );
      } catch (error) {
        console.error('Error initializing dashboard:', error);

        try {
          if (eventData.accessCode) {
            persistAccessCode(eventData.accessCode);
          }
        } catch {}
      }
    };

    const handleAccessCodeUpdated = (data: { accessCode: string }) => {
      if (!data?.accessCode) return;

      persistAccessCode(data.accessCode);
      toast.info(`Access code changed to ${data.accessCode}`);
    };

    const handleEventUpdated = (data: { event?: StoredEvent }) => {
      const event = data?.event;
      if (!event) return;

      if (event.accessCode) {
        persistAccessCode(event.accessCode);
      }

      setDashboardState((current) => ({
        ...current,
        djName: event.ownerName || current.djName,
        djProfilePicture:
          event.ownerProfilePicture ?? current.djProfilePicture,
      }));
    };

    const handleSongSuggested = (data: {
      participantId?: string;
      nickname?: string;
      title?: string;
    }) => {
      if (!data?.title || data.participantId === participantData._id) return;

      toast.info(`${data.nickname || 'Someone'} suggested ${data.title}!`);
    };

    const handleEventEnded = (data: { cancelled?: boolean; reason?: string }) => {
      if (isDj) return;

      const message = data?.cancelled
        ? `Event cancelled${data.reason ? `: ${data.reason}` : ''}`
        : 'The DJ ended the event';
      leaveAttendeeEvent(message);
    };

    const handleParticipantKicked = (data: {
      participantId?: string;
      reason?: string;
    }) => {
      if (isDj || data?.participantId !== participantData._id) return;

      const message = data.reason
        ? `You were removed from the event: ${data.reason}`
        : 'You were removed from the event';
      leaveAttendeeEvent(message);
    };

    const handleParticipantCooldown = (data: {
      participantId?: string;
      reason?: string;
      cooldownUntil?: string;
    }) => {
      if (isDj || data?.participantId !== participantData._id) return;

      const expiresAt = data.cooldownUntil
        ? new Date(data.cooldownUntil)
        : null;
      const untilMessage =
        expiresAt && !Number.isNaN(expiresAt.getTime())
          ? ` until ${expiresAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}`
          : '';
      const reasonMessage = data.reason ? ` Reason: ${data.reason}.` : '';

      toast.info(
        `You are on cooldown${untilMessage}. Requests and votes are disabled.${reasonMessage}`,
      );
    };

    onAccessCodeUpdated(handleAccessCodeUpdated);
    onEventUpdated(handleEventUpdated);
    onSongSuggested(handleSongSuggested);
    onEventEnded(handleEventEnded);
    on('participant_kicked', handleParticipantKicked);
    on('participant_cooldown', handleParticipantCooldown);

    if (socket?.connected) {
      void handleConnect();
    }
    socket?.on('connect', handleConnect);

    return () => {
      socket?.off('connect', handleConnect);
      stopWatchingSession();
      off('access_code_updated', handleAccessCodeUpdated);
      off('event_updated', handleEventUpdated);
      off('song_suggested', handleSongSuggested);
      off('event_ended', handleEventEnded);
      off('participant_kicked', handleParticipantKicked);
      off('participant_cooldown', handleParticipantCooldown);
    };
  }, [isDj, persistAccessCode]);

  return {
    dashboardState,
    handleProfilePictureChange,
    persistAccessCode,
  };
}
