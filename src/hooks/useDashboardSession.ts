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
import { StoredEvent, StoredParticipant, StoredUser } from '@/services/session';
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

const emptyDashboardState: DashboardState = {
  userName: 'User',
  profilePicture: null,
  djName: 'DJ',
  djProfilePicture: null,
  accessCode: '',
  eventId: '',
};

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

function entityId(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const entity = value as { _id?: string; id?: string };
  return entity._id ?? entity.id ?? null;
}

function eventOwnerId(event: unknown) {
  if (!event || typeof event !== 'object') return null;
  const owner = (event as { ownerId?: unknown }).ownerId;
  return typeof owner === 'string' ? owner : entityId(owner);
}

function storedUserId(user: StoredUser | null | undefined) {
  return user?._id ?? user?.id ?? null;
}

function participantEventId(participant: StoredParticipant | null | undefined) {
  return participant?.eventId ?? null;
}

function isDjUser(user: StoredUser | null | undefined) {
  const role = user?.role?.toLowerCase();
  return role === 'dj' || role === 'admin';
}

function storeDjEventSession(
  event: { _id?: string; id?: string; accessCode?: string; ownerId?: { profilePicture?: string | null } },
  user: StoredUser,
) {
  const eventId = entityId(event);
  const userId = storedUserId(user);
  if (!eventId || !userId) throw new Error(t('Session data is incomplete'));

  const eventData = {
    accessCode: event.accessCode,
    eventId,
    ownerName: user.displayName || 'DJ',
    ownerProfilePicture: user.profilePicture ?? event.ownerId?.profilePicture ?? null,
  };
  const participantData = {
    _id: userId,
    nickname: user.displayName || 'DJ',
    eventId,
    profilePicture: user.profilePicture || null,
  };

  setStoredEvent(eventData);
  setStoredParticipant(participantData);
  return { eventData, participantData };
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

export function getInitialDashboardState(mode: DashboardMode = 'attendee'): DashboardState {
  if (mode === 'dj') return emptyDashboardState;

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
    () => getInitialDashboardState(mode),
  );
  const [isSessionReady, setIsSessionReady] = useState(!isDj);

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
    const token = getAuthToken();

    setIsSessionReady(!isDj);

    if (!eventData || !participantData) {
      navigateAway();
      return;
    }

    if (isDj && (!token || !isDjUser(user))) {
      clearCurrentSession();
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

    const socket = initSocket(token ?? undefined);

    const handleConnect = async () => {
      try {
        let currentEventData = eventData;
        let currentParticipantData = participantData;

        if (isDj) {
          let freshEvent = null;
          const userId = storedUserId(user);
          if (currentEventData.eventId) {
            try {
              freshEvent = await eventsAPI.getEvent(currentEventData.eventId);
            } catch {}
          }

          if (eventOwnerId(freshEvent) !== storedUserId(user)) {
            freshEvent =
              (await eventsAPI.getMyActiveEvent()) ??
              (await eventsAPI.createEvent(
                `${user?.displayName || 'DJ'}'s Party`,
                'Auto-created event',
                new Date().toISOString(),
              ));
            ({ eventData: currentEventData, participantData: currentParticipantData } =
              storeDjEventSession(freshEvent, user as StoredUser));
          }

          const freshEventId = entityId(freshEvent);
          if (
            freshEventId &&
            (entityId(currentParticipantData) !== userId ||
              participantEventId(currentParticipantData) !== freshEventId)
          ) {
            ({ eventData: currentEventData, participantData: currentParticipantData } =
              storeDjEventSession(freshEvent, user as StoredUser));
          }

          setDashboardState((current) => ({
            ...current,
            userName: currentParticipantData.nickname || user?.displayName || current.userName,
            profilePicture:
              currentParticipantData.profilePicture ?? user?.profilePicture ?? current.profilePicture,
            accessCode: currentEventData.accessCode || current.accessCode,
          }));
        }

        if (!currentEventData.eventId || !currentParticipantData._id) {
          throw new Error(t('Session data is incomplete'));
        }

        setDashboardState((current) => ({
          ...current,
          djName: currentEventData.ownerName || current.djName,
          djProfilePicture:
            currentEventData.ownerProfilePicture ?? current.djProfilePicture,
          eventId: currentEventData.eventId || current.eventId,
        }));
        setIsSessionReady(true);

        const freshEvent = await eventsAPI.getEvent(currentEventData.eventId);
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
          syncStoredEvent(currentEventData, {
            accessCode: freshEvent.accessCode || currentEventData.accessCode,
            ownerProfilePicture: freshEvent.ownerId.profilePicture,
          });
        }

        joinEvent(
          currentEventData.eventId,
          currentParticipantData._id,
          currentParticipantData.nickname || 'User',
          currentParticipantData.profilePicture || user?.profilePicture || null,
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
    isSessionReady,
    persistAccessCode,
  };
}
