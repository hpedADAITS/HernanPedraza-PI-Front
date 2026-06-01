import React, { useEffect, useReducer } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { Crown, Users, Music, Zap, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ANIMATION_DURATION } from '@/constants/animations';
import { participantsAPI } from '@/services/api';
import { getStoredDjUserId } from '@/services/session';
import { getSocket } from '@/services/socket';
import type {
  ParticipantCooldownPayload,
  ParticipantEventPayload,
  ParticipantPremiumPayload,
} from '@/services/socket/contracts';
import { readStoredJson } from '@/utils/storage';
import { UserAvatar } from '@/components/common';

interface ConnectedUser {
  _id: string;
  nickname: string;
  profilePicture?: string | null;
  userId?:
    | string
    | {
        _id?: string;
        id?: string;
        profilePicture?: string | null;
      }
    | null;
  role?: string;
  joinedAt: string;
  socketId?: string;
  isPremium?: boolean;
  cooldownUntil?: Date | string;
}

function getParticipantProfilePicture(participant: ConnectedUser) {
  return participant.profilePicture
    ?? (typeof participant.userId === 'object'
      ? participant.userId?.profilePicture
      : null)
    ?? null;
}

function participantUserId(participant: ConnectedUser) {
  if (typeof participant.userId === 'string') return participant.userId;
  return participant.userId?._id ?? participant.userId?.id ?? null;
}

function isDjParticipant(
  participant: ConnectedUser,
  djParticipantId: string | null,
  djUserId: string | null,
) {
  const userId = participantUserId(participant);
  return participant.role === 'dj'
    || (!!djParticipantId
      && (participant._id === djParticipantId || userId === djParticipantId))
    || (!!djUserId && userId === djUserId);
}

function toCooldownDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

interface ConnectedUsersProps {
  mode: 'attendee' | 'dj';
  isDarkMode?: boolean;
  ownerProfilePicture?: string | null;
  currentProfilePicture?: string | null;
  previewDjName?: string | null;
  previewUsers?: ConnectedUser[];
  previewCurrentUserId?: string | null;
  previewParticipants?: ConnectedUser[];
}

interface ParticipantJoinedPayload extends ParticipantEventPayload {
  joinedAt: string;
  nickname: string;
  profilePicture?: string | null;
  role?: string;
  userId?: string | null;
  isPremium?: boolean;
}

function formatErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'string') return error || fallback;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function formatTimeAgo(joinedAt: string): string {
  const secondsAgo = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000);
  return secondsAgo < 60
    ? `${secondsAgo}s ago`
    : secondsAgo < 3600
      ? `${Math.floor(secondsAgo / 60)}m ago`
      : `${Math.floor(secondsAgo / 3600)}h ago`;
}

interface ConnectedUsersState {
  users: ConnectedUser[];
  loading: boolean;
  selectedParticipantId: string | null;
}

type ConnectedUsersAction =
  | { type: 'loading_started' }
  | { type: 'replace_users'; users: ConnectedUser[] }
  | { type: 'upsert_user'; user: ConnectedUser }
  | { type: 'remove_user'; participantId?: string }
  | { type: 'set_cooldown'; participantId?: string; cooldownUntil?: string | Date }
  | { type: 'set_premium'; participantId?: string; isPremium?: boolean }
  | { type: 'select_participant'; participantId: string | null };

function connectedUsersReducer(
  state: ConnectedUsersState,
  action: ConnectedUsersAction,
): ConnectedUsersState {
  switch (action.type) {
    case 'loading_started':
      return {
        ...state,
        loading: true,
      };
    case 'replace_users':
      return {
        ...state,
        users: action.users,
        loading: false,
      };
    case 'upsert_user': {
      const exists = state.users.some((user) => user._id === action.user._id);
      return {
        ...state,
        users: exists
          ? state.users.map((user) =>
              user._id === action.user._id ? action.user : user,
            )
          : [...state.users, action.user],
        loading: false,
      };
    }
    case 'remove_user':
      return {
        ...state,
        users: state.users.filter((user) => user._id !== action.participantId),
        selectedParticipantId:
          state.selectedParticipantId === action.participantId
            ? null
            : state.selectedParticipantId,
      };
    case 'set_cooldown':
      if (!action.participantId) {
        return state;
      }
      const cooldownUntil = toCooldownDate(action.cooldownUntil);
      return {
        ...state,
        users: state.users.map((user) =>
          user._id === action.participantId
            ? {
                ...user,
                cooldownUntil,
              }
            : user,
        ),
      };
    case 'set_premium':
      if (!action.participantId || typeof action.isPremium !== 'boolean') {
        return state;
      }
      return {
        ...state,
        users: state.users.map((user) =>
          user._id === action.participantId
            ? {
                ...user,
                isPremium: action.isPremium,
              }
            : user,
        ),
      };
    case 'select_participant':
      return {
        ...state,
        selectedParticipantId: action.participantId,
      };
    default:
      return state;
  }
}

export function ConnectedUsers({
  mode,
  isDarkMode = false,
  ownerProfilePicture,
  currentProfilePicture,
  previewDjName,
  previewUsers,
  previewCurrentUserId,
  previewParticipants,
}: ConnectedUsersProps) {
  const [state, dispatch] = useReducer(connectedUsersReducer, {
    users: [],
    loading: true,
    selectedParticipantId: null,
  });
  const isAttendee = mode === 'attendee';
  const isDj = mode === 'dj';
  const eventData = readStoredJson<{
    eventId?: string;
    ownerName?: string;
    ownerProfilePicture?: string | null;
  }>('currentEvent');
  const participantData = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
  const eventId = eventData?.eventId || null;
  const usesPreviewUsers = isAttendee && !!previewUsers;
  const usesPreviewParticipants = isDj && !!previewParticipants;
  const djName = isAttendee
    ? previewDjName ?? eventData?.ownerName ?? null
    : null;
  const djProfilePicture = isAttendee
    ? ownerProfilePicture ?? eventData?.ownerProfilePicture ?? null
    : null;
  const currentUserId = isAttendee
    ? previewCurrentUserId ?? participantData?._id ?? null
    : null;
  const users = usesPreviewUsers
    ? previewUsers
    : usesPreviewParticipants
      ? previewParticipants
      : state.users;
  const djIdentityId = getStoredDjUserId();
  const attendeeUsers = isDj
    ? users.filter((user) => !isDjParticipant(user, djIdentityId, djIdentityId))
    : users;
  const loading =
    usesPreviewUsers || usesPreviewParticipants ? false : state.loading;
  const selectedParticipantId = state.selectedParticipantId;

  useEffect(() => {
    if (usesPreviewUsers || usesPreviewParticipants) {
      return;
    }

    if (!eventId) {
      dispatch({ type: 'replace_users', users: [] });
      return;
    }

    dispatch({ type: 'loading_started' });

    const fetchUsers = async () => {
      try {
        const list = await participantsAPI.listEventParticipants(eventId);
        const userList = Array.isArray(list) ? list : [];

        if (isDj) {
          dispatch({ type: 'replace_users', users: userList });
          return;
        }

        dispatch({ type: 'replace_users', users: userList });
      } catch (error: unknown) {
        console.error('Error fetching connected users:', error);
        dispatch({ type: 'replace_users', users: [] });
      }
    };

    fetchUsers();

    const fallbackRefreshMs = 5 * 60 * 1000;
    const socket = getSocket();
    if (socket) {
      const handleParticipantJoined = (data: ParticipantJoinedPayload) => {
        if (isDj && isDjParticipant(
          {
            _id: data.participantId,
            nickname: data.nickname,
            joinedAt: data.joinedAt,
            role: data.role,
            userId: data.userId,
          },
          djParticipantId,
          djUserId,
        )) {
          return;
        }

        dispatch({
          type: 'upsert_user',
          user: {
            _id: data.participantId,
            nickname: data.nickname,
            profilePicture: data.profilePicture || null,
            joinedAt: data.joinedAt,
            socketId: 'connected',
            isPremium: data.isPremium,
          },
        });
      };

      const handleParticipantLeft = (data: ParticipantEventPayload) => {
        dispatch({ type: 'remove_user', participantId: data.participantId });
      };

      const handleParticipantKicked = (data: ParticipantEventPayload) => {
        dispatch({ type: 'remove_user', participantId: data.participantId });
      };

      const handleParticipantCooldown = (data: ParticipantCooldownPayload) => {
        if (!isDj) return;
        dispatch({
          type: 'set_cooldown',
          participantId: data.participantId,
          cooldownUntil: data.cooldownUntil,
        });
      };

      const handleParticipantPremiumUpdated = (data: ParticipantPremiumPayload) => {
        if (!isDj) return;
        dispatch({
          type: 'set_premium',
          participantId: data.participantId,
          isPremium: data.isPremium,
        });
      };

      socket.on('participant_joined', handleParticipantJoined);
      socket.on('participant_left', handleParticipantLeft);
      socket.on('participant_kicked', handleParticipantKicked);
      if (isDj) {
        socket.on('participant_cooldown', handleParticipantCooldown);
        socket.on('participant_premium_updated', handleParticipantPremiumUpdated);
      }

      const interval = isDj ? setInterval(fetchUsers, fallbackRefreshMs) : null;

      return () => {
        if (interval) clearInterval(interval);
        socket.off('participant_joined', handleParticipantJoined);
        socket.off('participant_left', handleParticipantLeft);
        socket.off('participant_kicked', handleParticipantKicked);
        if (isDj) {
          socket.off('participant_cooldown', handleParticipantCooldown);
          socket.off(
            'participant_premium_updated',
            handleParticipantPremiumUpdated,
          );
        }
      };
    }

    if (isDj) {
      const interval = setInterval(fetchUsers, fallbackRefreshMs);
      return () => clearInterval(interval);
    }
  }, [
    eventId,
    djIdentityId,
    isAttendee,
    isDj,
    usesPreviewParticipants,
    usesPreviewUsers,
  ]);
  const premiumCount = attendeeUsers.filter((user) => user.isPremium).length;
  const connectedCount = isDj
    ? attendeeUsers.filter((user) => user.socketId).length
    : attendeeUsers.length;
  const totalCount = attendeeUsers.length;
  const bgColor = isDarkMode
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)';

  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-900';
  const mutedColor = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const borderColor = isDarkMode ? 'border-slate-700' : 'border-slate-200';
  const hoverBgColor = isDarkMode ? 'hover:bg-slate-700/40' : 'hover:bg-slate-50';

  const handleRemoveParticipant = (participantId: string) => {
    dispatch({ type: 'remove_user', participantId });
  };

  return (
    <LazyMotion features={domAnimation}>
      <TooltipProvider>
      <m.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
        transition={
          isDj ? { type: 'spring', stiffness: 380, damping: 42 } : undefined
        }
        className={
          isDj
            ? 'bg-white rounded-3xl shadow-lg p-7 lg:p-6 flex min-h-[280px] flex-col gap-5 lg:gap-4'
            : `rounded-2xl backdrop-blur-sm border ${borderColor} shadow-xl overflow-hidden`
        }
        style={isAttendee ? { background: bgColor } : undefined}
      >
        {isAttendee ? (
          <AttendeeConnectedUsers
            users={users}
            loading={loading}
            djName={djName}
            djProfilePicture={djProfilePicture}
            currentUserId={currentUserId}
            currentProfilePicture={currentProfilePicture}
            connectedCount={connectedCount}
            totalCount={totalCount}
            isDarkMode={isDarkMode}
            textColor={textColor}
            mutedColor={mutedColor}
            borderColor={borderColor}
            hoverBgColor={hoverBgColor}
          />
        ) : (
          <DjConnectedUsers
            users={attendeeUsers}
            loading={loading}
            connectedCount={connectedCount}
            premiumCount={premiumCount}
            selectedParticipantId={selectedParticipantId}
            setSelectedParticipantId={(participantId) =>
              dispatch({
                type: 'select_participant',
                participantId,
              })
            }
            onRemoveParticipant={handleRemoveParticipant}
            eventId={eventId}
          />
        )}
      </m.div>
      </TooltipProvider>
    </LazyMotion>
  );
}

interface AttendeeConnectedUsersProps {
  users: ConnectedUser[];
  loading: boolean;
  djName: string | null;
  djProfilePicture: string | null;
  currentUserId: string | null;
  currentProfilePicture?: string | null;
  connectedCount: number;
  totalCount: number;
  isDarkMode: boolean;
  textColor: string;
  mutedColor: string;
  borderColor: string;
  hoverBgColor: string;
}

function AttendeeConnectedUsers({
  users,
  loading,
  djName,
  djProfilePicture,
  currentUserId,
  currentProfilePicture,
  connectedCount,
  totalCount,
  isDarkMode,
  textColor,
  mutedColor,
  borderColor,
  hoverBgColor,
}: AttendeeConnectedUsersProps) {
  return (
    <>
      <div
        className={`px-6 lg:px-4 py-4 lg:py-3 border-b ${borderColor} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          <Users
            size={24}
            className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}
          />
          <div>
            <h3 className={`text-base font-semibold ${textColor}`}>
              Connected Users
            </h3>
            <p className={`text-xs ${mutedColor}`}>
              {users.length + (djName ? 1 : 0)} {users.length + (djName ? 1 : 0) === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        <div
          className={`${isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'} rounded-full px-3 py-1`}
          aria-label={`${connectedCount} of ${totalCount} attendees connected`}
        >
          <p className="text-sm font-semibold">
            {connectedCount}/{totalCount}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className={`px-6 py-8 text-center ${mutedColor} text-sm`}>
          <div className="flex items-center justify-center gap-2">
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <Zap size={16} />
            </m.div>
                Loading participants…
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && (
        <div className="px-6 lg:px-4 py-4 lg:py-3 flex min-h-0 flex-col h-full">
          {/* DJ Section - Centered */}
          {djName && (
            <m.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center mb-6 lg:mb-3"
            >
              <div className="flex flex-row items-center gap-3">
                {/* DJ Avatar */}
                <UserAvatar
                  name={djName}
                  profilePicture={djProfilePicture}
                  imageAlt={`${djName} profile`}
                  className="w-16 h-16 lg:w-12 lg:h-12 rounded-full overflow-hidden shadow-xl"
                  fallbackClassName="bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xl lg:text-base"
                />
                {/* DJ Info */}
                <div className="text-center">
                  <p className={`text-sm font-semibold ${textColor}`}>{djName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 justify-center">
                    <Music size={13} className={isDarkMode ? 'text-amber-400' : 'text-amber-600'} />
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      DJ
                    </span>
                  </div>
                </div>
              </div>
            </m.div>
          )}

          {/* Divider */}
          {djName && (
            <div className={`h-px w-full mb-4 bg-gradient-to-r from-transparent via-slate-300 to-transparent ${isDarkMode ? 'via-slate-600' : ''}`} />
          )}

          {/* Attendees Header */}
          {djName && users.length > 0 && (
            <p className={`text-xs font-semibold uppercase tracking-widest ${mutedColor} mb-3`}>
              Attendees
            </p>
          )}

          {/* Attendees Grid */}
          {users.length === 0 ? (
            <div className={`text-center py-8 ${mutedColor}`}>
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{djName ? 'No other attendees yet' : 'No participants'}</p>
            </div>
          ) : (
            <m.div layout className="grid grid-cols-2 gap-3 lg:gap-2">
              <AnimatePresence>
                {users
                  .sort((a, b) => {
                    // Current user always first
                    if (a._id === currentUserId) return -1;
                    if (b._id === currentUserId) return 1;
                    return 0;
                  })
                  .map((user) => {
                    const isCurrentUser = user._id === currentUserId;
                    const displayName = isCurrentUser ? 'You' : user.nickname;

                    return (
                      <m.div
                        key={user._id}
                        layout
                        initial={{ opacity: 0, scale: 0.98, y: 6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{
                          opacity: 0,
                          scale: 0.98,
                          y: 6,
                          transition: { duration: 0.16 },
                        }}
                        transition={{ type: 'spring', stiffness: 380, damping: 42 }}
                        className={`relative p-3 lg:p-2 rounded-xl border ${borderColor} ${hoverBgColor} transition-colors group cursor-default ${isCurrentUser ? (isDarkMode ? 'bg-blue-500/15 border-blue-400/50' : 'bg-blue-50 border-blue-200') : ''}`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          {/* Avatar */}
                          <UserAvatar
                            name={displayName}
                            profilePicture={
                              isCurrentUser
                                ? currentProfilePicture ??
                                  getParticipantProfilePicture(user)
                                : getParticipantProfilePicture(user)
                            }
                            imageAlt={`${displayName} profile`}
                            className="w-10 h-10 lg:w-8 lg:h-8 rounded-full overflow-hidden shadow-md"
                            fallbackClassName={`flex items-center justify-center text-white font-bold text-sm ${
                              isCurrentUser
                                ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                                : 'bg-gradient-to-br from-emerald-400 to-blue-500'
                            }`}
                          />

                          {/* Name */}
                          <div className="flex w-full min-w-0 items-center justify-center gap-1 px-1">
                            <p
                              className={`min-w-0 truncate text-xs font-semibold ${textColor} ${
                                isCurrentUser ? 'italic font-bold' : ''
                              }`}
                            >
                              {displayName}
                            </p>
                            {user.isPremium && (
                              <Crown
                                size={13}
                                className="flex-shrink-0 text-amber-400"
                                fill="currentColor"
                                aria-label="Priority attendee"
                              />
                            )}
                          </div>

                          {/* Status Indicator */}
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${
                                isCurrentUser ? 'bg-blue-500' : 'bg-emerald-500'
                              }`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                isCurrentUser
                                  ? isDarkMode
                                    ? 'text-blue-400'
                                    : 'text-blue-600'
                                  : isDarkMode
                                    ? 'text-emerald-400'
                                    : 'text-emerald-600'
                              }`}
                            >
                              {isCurrentUser ? 'You' : 'Online'}
                            </span>
                          </div>
                        </div>
                      </m.div>
                    );
                  })}
              </AnimatePresence>
            </m.div>
          )}
        </div>
      )}
    </>
  );
}

interface DjConnectedUsersProps {
  users: ConnectedUser[];
  loading: boolean;
  connectedCount: number;
  premiumCount: number;
  selectedParticipantId: string | null;
  setSelectedParticipantId: (id: string | null) => void;
  onRemoveParticipant: (id: string) => void;
  eventId: string | null;
}

function DjConnectedUsers({
  users,
  loading,
  connectedCount,
  premiumCount,
  selectedParticipantId,
  setSelectedParticipantId,
  onRemoveParticipant,
  eventId,
}: DjConnectedUsersProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-slate-700" />
          <h3 className="text-lg font-bold text-slate-800">Connected Users</h3>
        </div>
        <div className="bg-emerald-100 rounded-full px-3 py-1">
          <p className="text-sm font-semibold text-emerald-700">
            {connectedCount}/{users.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:gap-2">
        <div className="bg-slate-50 rounded-xl p-3 lg:p-2">
          <p className="text-xs text-slate-600 mb-1">Total</p>
          <p className="text-xl font-bold text-slate-800">{users.length}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 lg:p-2">
          <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
            <Crown size={14} /> Premium (Priority) Queue
          </p>
          <p className="text-xl font-bold text-amber-700">{premiumCount}</p>
        </div>
      </div>

      {users.length === 0 ? (
        <m.div layout className="text-center text-slate-500 py-8">
          {loading ? 'Loading…' : 'No participants yet'}
        </m.div>
      ) : (
        <m.div layout className="flex flex-col gap-2">
          <AnimatePresence>
            {users
              .toSorted((a, b) => {
                if (a.isPremium === b.isPremium) return 0;
                return a.isPremium ? -1 : 1;
              })
              .map((participant) => (
                <ParticipantItem
                  key={participant._id}
                  participant={participant}
                  isSelected={selectedParticipantId === participant._id}
                  onSelect={(id) =>
                    setSelectedParticipantId(
                      selectedParticipantId === id ? null : id,
                    )
                  }
                  onRemove={onRemoveParticipant}
                  eventId={eventId}
                />
              ))}
          </AnimatePresence>
        </m.div>
      )}
    </>
  );
}

interface ParticipantItemProps {
  participant: ConnectedUser;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  eventId: string | null;
}

function ParticipantItem({
  participant,
  isSelected,
  onSelect,
  onRemove,
  eventId,
}: ParticipantItemProps) {
  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      if (action === 'Cooldown' && eventId) {
        const promise = participantsAPI.setCooldown(
          participant._id,
          5 * 60 * 1000,
          'DJ cooldown',
        );
        await toast.promise(promise, {
          success: `Cooldown applied to "${participant.nickname}"`,
          error: (err: unknown) =>
            `Failed to apply cooldown: ${formatErrorMessage(
              err,
              'Unknown error',
            )}`,
        });
        onSelect(null);
      } else if (action === 'Kick' && eventId) {
        const promise = participantsAPI.kickParticipant(
          participant._id,
          'Kicked by DJ',
        );
        await toast.promise(promise, {
          success: `Kicked "${participant.nickname}"`,
          error: (err: unknown) =>
            `Failed to kick: ${formatErrorMessage(err, 'Unknown error')}`,
        });
        onRemove(participant._id);
        onSelect(null);
      }
    } catch (error: unknown) {
      console.error(`Error executing ${action}:`, error);
    }
  };

  return (
    <m.div
      layout
      exit={{
        opacity: 0,
        x: 20,
        scale: 0.95,
        transition: { duration: 0.3 },
      }}
      onClick={() => onSelect(participant._id)}
      className="bg-slate-50 rounded-xl p-3 lg:p-2 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <UserAvatar
          name={participant.nickname}
          profilePicture={getParticipantProfilePicture(participant)}
          imageAlt={`${participant.nickname} profile`}
          className="w-10 h-10 lg:w-9 lg:h-9 rounded-full overflow-hidden flex-shrink-0"
          fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm"
        />

        <AnimatePresence mode="wait">
          {isSelected ? (
            <m.div
              key="admin-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction('Cooldown', e);
                    }}
                    className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700 transition-colors"
                  >
                    <Zap size={16} />
                  </m.button>
                </TooltipTrigger>
                <TooltipContent>Cooldown User</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction('Kick', e);
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                  >
                    <UserX size={16} />
                  </m.button>
                </TooltipTrigger>
                <TooltipContent>Kick User</TooltipContent>
              </Tooltip>
            </m.div>
          ) : (
            <m.div
              key="participant-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">
                {participant.nickname}
              </p>
              <p className="text-xs text-slate-500">
                {formatTimeAgo(participant.joinedAt)}
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.isPremium && (
          <Crown size={16} style={{ color: '#facc15', fill: '#facc15' }} />
        )}
        {participant.socketId && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">Online</span>
          </div>
        )}
      </div>
    </m.div>
  );
}
