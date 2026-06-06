import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import type { NavigateToView } from '@/types';
import { disconnectSocket, initSocket, joinEvent, off, on, onAccessCodeUpdated, onEventEnded, onEventUpdated, onParticipantBanned, onSongSuggested } from '@/services/socket';
import type { AccessCodeUpdatedPayload, EventEndedPayload, EventUpdatedPayload, ParticipantCooldownPayload, ParticipantEventPayload, ParticipantUpdatedPayload, SongEventPayload } from '@/services/socket/contracts';
import { authAPI, eventsAPI } from '@/services/api';
import { clearStoredEvent, clearStoredParticipant, clearStoredUser, getAuthToken, getStoredEvent, getStoredParticipant, getStoredUser, setStoredEvent, setStoredParticipant, setStoredUser, isDjRole, getStoredDjUserId, type StoredEvent, type StoredParticipant, type StoredUser } from '@/services/session';
import { decodeJwtPayload, type JwtSessionPayload } from '@/services/api/client';
import {
  activateSingleUserSession,
  consumeSingleUserSessionCheckSuspension,
  isCurrentUserSessionActive,
  onCurrentUserSessionReplaced,
} from '@/services/singleUserSession';
import { useToast } from '@/hooks/useToast';
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

function storedUserId(user: StoredUser | null | undefined) {
  return user?._id ?? user?.id ?? null;
}

function storedEventId(event: StoredEvent | null | undefined) {
  return event?.eventId ?? event?._id ?? event?.id ?? null;
}

function storedParticipantEventId(participant: StoredParticipant | null | undefined) {
  return participant?.eventId ?? null;
}

function normalizeTokenString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function authTokenUserId(token: string | null) {
  const payload = decodeJwtPayload(token);

  return (
    normalizeTokenString(payload?.userId) ??
    normalizeTokenString(payload?.sub) ??
    normalizeTokenString(payload?.id) ??
    normalizeTokenString(payload?._id)
  );
}

function authTokenRole(token: string | null) {
  const payload = decodeJwtPayload(token) as (JwtSessionPayload & { role?: unknown }) | null;
  const role = (payload && 'role' in payload ? payload.role : null) as string | null;
  return role ?? null;
}

function isDjTokenForStoredUser(token: string | null, user: StoredUser | null | undefined) {
  const tokenId = authTokenUserId(token);
  const userId = storedUserId(user);
  const role = authTokenRole(token);

  return Boolean(
    tokenId &&
    userId &&
    tokenId === userId &&
    isDjRole(role),
  );
}

function isStoredUserDj(user: StoredUser | null | undefined) {
  return isDjRole(user?.role);
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
  const toast = useToast();
  const isDj = mode === 'dj';
  const [dashboardState, setDashboardState] = useState<DashboardState>(
    () => getInitialDashboardState(mode),
  );
  const [isSessionReady, setIsSessionReady] = useState(!isDj);
  const [sessionError, setSessionError] = useState<string | null>(null);

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
    let participantData = getStoredParticipant();
    let user = getStoredUser();
    const token = getAuthToken();
    let userId = storedUserId(user);
    const eventId = storedEventId(eventData);

    if (isDj && eventData && userId && !participantData) {
      participantData = {
        _id: userId,
        nickname: user?.displayName || 'DJ',
        eventId: eventId || undefined,
        profilePicture: user?.profilePicture || null,
      };
      setStoredParticipant(participantData);
    }

    const participantId = entityId(participantData);

    setIsSessionReady(!isDj);
    setSessionError(null);

    if (!eventData || !participantData) {
      navigateAway();
      return;
    }

    if (isDj && (!token || !isStoredUserDj(user) || !isDjTokenForStoredUser(token, user))) {
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
        let currentUser = user;
        let currentUserId = userId;

        if (isDj) {
          if (!currentUserId) {
            const freshUser = await authAPI.getCurrentUser();
            if (freshUser) {
              currentUser = freshUser;
              currentUserId = storedUserId(freshUser);
              setStoredUser(freshUser);
              activateSingleUserSession(freshUser);
            }
          }

          let freshEvent = null;
          const currentEventId = storedEventId(currentEventData);

          if (!currentEventId) {
            freshEvent =
              (await eventsAPI.getMyActiveEvent().catch(() => null)) ??
              (await eventsAPI.createEvent(
                `${currentUser?.displayName || 'DJ'}'s Party`,
                'Auto-created event',
                new Date().toISOString(),
              ));
            ({ eventData: currentEventData, participantData: currentParticipantData } =
              storeDjEventSession(freshEvent, currentUser as StoredUser));
          }

          const resolvedEventId = storedEventId(currentEventData);
          if (resolvedEventId && entityId(currentParticipantData) !== currentUserId) {
            ({ eventData: currentEventData, participantData: currentParticipantData } =
              storeDjEventSession(
                {
                  id: resolvedEventId,
                  accessCode: currentEventData.accessCode,
                  ownerId: { profilePicture: currentEventData.ownerProfilePicture ?? null },
                },
                currentUser as StoredUser,
              ));
          }

          setDashboardState((current) => ({
            ...current,
            userName: currentParticipantData.nickname || currentUser?.displayName || current.userName,
            profilePicture:
              currentParticipantData.profilePicture ?? currentUser?.profilePicture ?? current.profilePicture,
            accessCode: currentEventData.accessCode || current.accessCode,
          }));
        } else {
          setDashboardState((current) => ({
            ...current,
            userName: currentParticipantData.nickname || user?.displayName || current.userName,
            profilePicture:
              currentParticipantData.profilePicture ?? user?.profilePicture ?? current.profilePicture,
          }));
        }

        const currentEventId = storedEventId(currentEventData);
        let currentParticipantId = entityId(currentParticipantData);
        if (!currentEventId || !currentParticipantId) {
          throw new Error(t('Session data is incomplete'));
        }

        if (!isDj && !storedParticipantEventId(currentParticipantData)) {
          currentParticipantData = {
            ...currentParticipantData,
            eventId: currentEventId,
          };
          setStoredParticipant(currentParticipantData);
          currentParticipantId = entityId(currentParticipantData);
          if (!currentParticipantId) {
            throw new Error(t('Session data is incomplete'));
          }
        }

        setDashboardState((current) => ({
          ...current,
          djName: currentEventData.ownerName || current.djName,
          djProfilePicture:
            currentEventData.ownerProfilePicture ?? current.djProfilePicture,
          eventId: currentEventId,
        }));
        setIsSessionReady(true);

        const freshEvent = await eventsAPI.getEvent(currentEventId).catch(() => null);
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
          currentEventId,
          currentParticipantId,
          currentParticipantData.nickname || 'User',
          currentParticipantData.profilePicture || currentUser?.profilePicture || undefined,
        );
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        setSessionError(
          error instanceof Error
            ? error.message
            : t('Failed to initialize dashboard session'),
        );

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
      if (!data?.title || data.participantId === participantId) return;

      toast.info(t('{name} suggested {title}!', {
        name: data.nickname || t('Someone'),
        title: data.title,
      }));
    };

    const handleParticipantUpdated = (data: ParticipantUpdatedPayload) => {
      if (!data.participantId || data.participantId !== participantId) {
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
      if (isDj || data?.participantId !== participantId) return;

      const message = data.reason
        ? t('You were removed from the event: {reason}', { reason: data.reason })
        : t('You were removed from the event');
      leaveAttendeeEvent(message);
    };

    const handleParticipantCooldown = (data: ParticipantCooldownPayload) => {
      if (isDj || data?.participantId !== participantId) return;

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
      if (isDj || data?.participantId !== participantId) return;

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
    sessionError,
  };
}
