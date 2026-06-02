import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { NavigateToView } from '@/types';
import { disconnectSocket, initSocket, joinEvent, off, on, onAccessCodeUpdated, onEventEnded, onEventUpdated, onParticipantBanned, onSongSuggested } from '@/services/socket';
import type { AccessCodeUpdatedPayload, EventEndedPayload, EventUpdatedPayload, ParticipantCooldownPayload, ParticipantEventPayload, ParticipantUpdatedPayload, SongEventPayload } from '@/services/socket/contracts';
import { eventsAPI } from '@/services/api';
import { clearStoredEvent, clearStoredParticipant, clearStoredUser, getAuthToken, getStoredEvent, getStoredParticipant, getStoredUser, setStoredEvent, setStoredParticipant } from '@/services/session';
import {
  activateSingleUserSession,
  consumeSingleUserSessionCheckSuspension,
  isCurrentUserSessionActive,
  onCurrentUserSessionReplaced,
} from '@/services/singleUserSession';
import { toast } from 'sonner';
import { StoredEvent } from '@/services/session';
import { t } from '@/i18n';

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

function syncStoredParticipantProfile(updates: {
  nickname?: string;
  profilePicture?: string | null;
  cooldownUntil?: string | Date | null;
  cooldownReason?: string | null;
}) {
  const participant = getStoredParticipant();
  if (!participant) return;

  setStoredParticipant({
    ...participant,
    ...updates,
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

  const banAttendee = useEffectEvent((message: string) => {
    if (isDj) return;

    toast.error(message);
    clearAttendeeEventSession();
    onNavigate('banned');
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

    const skipSessionCheck = consumeSingleUserSessionCheckSuspension();
    if (skipSessionCheck) {
      activateSingleUserSession(user);
    } else if (!isCurrentUserSessionActive(user)) {
      clearCurrentSession();
      toast.info(t('This account is active in another window. Please log in again here to continue.'));
      navigateAway();
      return;
    }

    const stopWatchingSession = onCurrentUserSessionReplaced(user, () => {
      clearCurrentSession();
      toast.info(t('This account was opened in another window. This session has been closed.'));
      navigateAway();
    });

    const token = getAuthToken();
    const socket = initSocket(token ?? undefined);

    const handleConnect = async () => {
      try {
        if (!eventData.eventId || !participantData._id) {
          throw new Error(t('Session data is incomplete'));
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

    const handleAccessCodeUpdated = (data: AccessCodeUpdatedPayload) => {
      if (!data?.accessCode) return;

      persistAccessCode(data.accessCode);
      toast.info(t('Access code changed to {code}', { code: data.accessCode }));
    };

    const handleEventUpdated = (data: EventUpdatedPayload) => {
      const event = data?.event;
      if (!event || typeof event !== 'object') return;

      const eventUpdate = event as Partial<StoredEvent>;

      if (eventUpdate.accessCode) {
        persistAccessCode(eventUpdate.accessCode);
      }

      setDashboardState((current) => ({
        ...current,
        djName: eventUpdate.ownerName || current.djName,
        djProfilePicture:
          eventUpdate.ownerProfilePicture ?? current.djProfilePicture,
      }));
    };

    const handleSongSuggested = (data: SongEventPayload & { nickname?: string; participantId?: string }) => {
      if (!data?.title || data.participantId === participantData._id) return;

      toast.info(t('{name} suggested {title}!', {
        name: data.nickname || t('Someone'),
        title: data.title,
      }));
    };

    const handleParticipantUpdated = (data: ParticipantUpdatedPayload) => {
      if (!data.participantId || data.participantId !== participantData._id) {
        return;
      }

      syncStoredParticipantProfile({
        ...(data.nickname !== undefined ? { nickname: data.nickname } : {}),
        ...(data.profilePicture !== undefined
          ? { profilePicture: data.profilePicture }
          : {}),
      });
      setDashboardState((current) => ({
        ...current,
        userName: data.nickname ?? current.userName,
        profilePicture:
          data.profilePicture === undefined
            ? current.profilePicture
            : data.profilePicture,
      }));
    };

    const handleEventEnded = (data: EventEndedPayload & { cancelled?: boolean }) => {
      if (isDj) return;

      const message = data?.cancelled
        ? data.reason
          ? t('Event cancelled: {reason}', { reason: data.reason })
          : t('Event cancelled')
        : t('The DJ ended the event');
      leaveAttendeeEvent(message);
    };

    const handleParticipantKicked = (data: ParticipantEventPayload & { reason?: string }) => {
      if (isDj || data?.participantId !== participantData._id) return;

      const message = data.reason
        ? t('You were removed from the event: {reason}', { reason: data.reason })
        : t('You were removed from the event');
      leaveAttendeeEvent(message);
    };

    const handleParticipantCooldown = (data: ParticipantCooldownPayload) => {
      if (isDj || data?.participantId !== participantData._id) return;

      const expiresAt = data.cooldownUntil
        ? new Date(data.cooldownUntil)
        : null;
      const untilMessage =
        expiresAt && !Number.isNaN(expiresAt.getTime())
          ? t(' until {time}', { time: expiresAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }) })
          : '';
      const reasonMessage = data.reason ? t(' Reason: {reason}.', { reason: data.reason }) : '';

      syncStoredParticipantProfile({
        cooldownUntil: data.cooldownUntil ?? null,
        cooldownReason: data.reason ?? null,
      });

      toast.info(
        t('You are on cooldown{until}. Song requests are disabled.{reason}', {
          until: untilMessage,
          reason: reasonMessage,
        }),
      );
    };

    const handleParticipantBanned = (data: ParticipantEventPayload & { reason?: string }) => {
      if (isDj || data?.participantId !== participantData._id) return;

      const message = data.reason
        ? t('You were banned from the event: {reason}', { reason: data.reason })
        : t('You were banned from the event');
      banAttendee(message);
    };

    onAccessCodeUpdated(handleAccessCodeUpdated);
    onEventUpdated(handleEventUpdated);
    onSongSuggested(handleSongSuggested);
    on('participant_updated', handleParticipantUpdated);
    onEventEnded(handleEventEnded);
    on('participant_kicked', handleParticipantKicked);
    on('participant_cooldown', handleParticipantCooldown);
    onParticipantBanned(handleParticipantBanned);

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
      off('participant_updated', handleParticipantUpdated);
      off('event_ended', handleEventEnded);
      off('participant_kicked', handleParticipantKicked);
      off('participant_cooldown', handleParticipantCooldown);
      off('participant_banned', handleParticipantBanned);
    };
  }, [isDj, persistAccessCode]);

  return {
    dashboardState,
    handleProfilePictureChange,
    persistAccessCode,
  };
}
