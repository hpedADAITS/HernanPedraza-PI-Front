import React, { useState, useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { ArrowDown, ArrowUp, LogOut, Music2, Plus, Settings, Users } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, eventsAPI, participantsAPI, authAPI, clearToken } from '@/services/api';
import * as socket from '@/services/socket';
import { disconnectSocket } from '@/services/socket';
import { readStoredJson, removeStoredItem } from '@/utils/storage';
import { clearEventCoverCache } from '@/services/cache/coverArtSessionCache';
import { useTrackedTimeout } from '@/hooks/useTrackedTimeout';
import { useSound } from '@/hooks/useSound';
import { useViewNavigate } from '@/router/navigationContext';
import { AttendeePasswordPrompt } from './AttendeeSavePrompt';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';

interface ActionButtonsProps {
  mode: 'attendee' | 'dj';
  onNavigate?: NavigateToView;
  showVoting?: boolean;
  showActions?: boolean;
}

interface AttendeePasswordPromptRequestedPayload {
  participantId?: string;
}

interface QueueUpdatedPayload {
  queue?: CurrentSong[];
}

interface EventSettings {
  votingEnabled?: boolean;
  allowDownvotes?: boolean;
}

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const getCurrentParticipantId = () => {
  const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
  return participant?._id || participant?.id || null;
};

const VOTE_BUTTON_COLORS = {
  emerald: {
    button:
      'border-emerald-300/80 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,0.42),transparent_30%),linear-gradient(135deg,#059669_0%,#10b981_52%,#22c55e_100%)] text-white shadow-[0_14px_32px_rgba(16,185,129,0.32),inset_0_1px_0_rgba(255,255,255,0.36)] hover:border-emerald-200 focus-visible:ring-emerald-200',
    icon: 'bg-black/10 ring-1 ring-white/35 group-hover:bg-white/16',
    accent: 'text-emerald-100',
  },
  red: {
    button:
      'border-rose-300/80 bg-[radial-gradient(circle_at_70%_18%,rgba(255,255,255,0.38),transparent_30%),linear-gradient(135deg,#be123c_0%,#f43f5e_54%,#fb7185_100%)] text-white shadow-[0_14px_32px_rgba(244,63,94,0.28),inset_0_1px_0_rgba(255,255,255,0.34)] hover:border-rose-200 focus-visible:ring-rose-200',
    icon: 'bg-black/10 ring-1 ring-white/35 group-hover:bg-white/16',
    accent: 'text-rose-100',
  },
};

export function ActionButtons({
  mode,
  onNavigate,
  showVoting = true,
  showActions = true,
}: ActionButtonsProps) {
  const { error } = useToast();
  const navigate = useViewNavigate(onNavigate);
  const { playSound } = useSound();
  const isDj = mode === 'dj';
  const [isQueueHovered, setIsQueueHovered] = useState(false);
  const [isLeaveHovered, setIsLeaveHovered] = useState(false);
  const queueHoverTimeoutRef = useRef<number | null>(null);
  const leaveHoverTimeoutRef = useRef<number | null>(null);
  const { clearTrackedTimeout, setTrackedTimeout } = useTrackedTimeout();
  const [passwordPrompt, setPasswordPrompt] = useState<{
    reason: 'leave' | 'duplicate-login';
    afterSave?: () => void;
    afterSkip?: () => void;
  } | null>(null);

  const updateDelayedHover = (
    ref: React.MutableRefObject<number | null>,
    setHovered: (isHovered: boolean) => void,
    nextHovered: boolean,
  ) => {
    if (ref.current) {
      clearTrackedTimeout(ref.current);
      ref.current = null;
    }

    if (!nextHovered) {
      setHovered(false);
      return;
    }

    ref.current = setTrackedTimeout(() => {
      ref.current = null;
      setHovered(true);
    }, 70);
  };

  const handleQueueHoverChange = (nextHovered: boolean) =>
    updateDelayedHover(queueHoverTimeoutRef, setIsQueueHovered, nextHovered);

  const handleLeaveHoverChange = (nextHovered: boolean) =>
    updateDelayedHover(leaveHoverTimeoutRef, setIsLeaveHovered, nextHovered);

  useEffect(() => {
    if (isDj) return undefined;

    const handlePasswordPromptRequested = (
      data: AttendeePasswordPromptRequestedPayload,
    ) => {
      const participant = readStoredJson<{ _id?: string; id?: string; passwordProtected?: boolean }>('currentParticipant');
      if (!participant) return;
      if ((participant._id || participant.id) !== data.participantId) return;
      if (participant.passwordProtected) return;
      setPasswordPrompt({ reason: 'duplicate-login' });
    };

    socket.onAttendeePasswordPromptRequested(handlePasswordPromptRequested);

    return () => {
      socket.off(
        'attendee_password_prompt_requested',
        handlePasswordPromptRequested,
      );
    };
  }, [isDj]);

  const finishLeaveParty = async () => {
    let eventIdForCleanup: string | null = null;
    if (isDj) {
      const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
      const eventId = event?.eventId || event?._id || event?.id || '';
      eventIdForCleanup = eventId || null;
      if (eventId) {
        try {
          await eventsAPI.endEvent(eventId);
        } catch (err: unknown) {
          error(getErrorMessage(err, t('Failed to end event')));
        }
      }
    } else {
      const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
      const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
      eventIdForCleanup = event?.eventId || event?._id || event?.id || null;
      if (event && participant) {
        const eventId = event.eventId || event._id || event.id;
        const participantId = participant._id || participant.id;
        if (eventId && participantId) {
          try {
            socket.leaveEvent(eventId, participantId);
          } catch {
            // Ignore socket errors on leave
          }
          await participantsAPI.leaveEvent(participantId);
        }
      }
    }
    clearToken();
    clearEventCoverCache(eventIdForCleanup);
    disconnectSocket();
    removeStoredItem('currentEvent');
    removeStoredItem('currentParticipant');
    removeStoredItem('user');
    navigate(isDj ? 'dj-login' : 'attendee-login');
  };

  const finishAttendeeLeaveWithoutSavedProfile = async () => {
    const participantId = getCurrentParticipantId();
    if (participantId) {
      try {
        await authAPI.updateProfilePicture({ profilePicture: null });
        await participantsAPI.updateProfile(participantId, { profilePicture: null });
      } catch (err: unknown) {
        error(getErrorMessage(err, t('Failed to remove profile picture')));
        return;
      }
    }

    await finishLeaveParty();
  };

  const handleLeaveParty = async () => {
    playSound('leaveParty');
    if (!isDj) {
      setPasswordPrompt({
        reason: 'leave',
        afterSave: finishLeaveParty,
        afterSkip: finishAttendeeLeaveWithoutSavedProfile,
      });
      return;
    }

    await finishLeaveParty();
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 lg:gap-3 items-center">
        {showVoting && !isDj && <VotingButtons />}

        {showActions && (
          <div className="flex w-full max-w-[744px] flex-wrap items-center justify-center gap-4">
            <ActionButton
              icon={Plus}
              label={t('Queue a song')}
              subtitle={t('Add to the upcoming list')}
              onClick={() =>
                navigate(isDj ? 'dj-song-select' : 'attendee-song-select')
              }
              variant="queue"
              queueTone={isDj ? 'dj' : 'attendee'}
              onHoverChange={handleQueueHoverChange}
              soundKey="suggestSong"
            />

            <ActionButton
              icon={Settings}
              label={t('Settings')}
              subtitle={t('Manage your experience')}
              onClick={() =>
                navigate(isDj ? 'dj-settings' : 'attendee-settings')
              }
              variant="settings"
              iconOnly
              soundKey="settingsOpen"
            />

            {!isDj && (
              <ActionButton
                icon={Users}
                label={t('Friends')}
                subtitle={t('Manage friends')}
                onClick={() => navigate('attendee-friends')}
                variant="friends"
                collapsed={isLeaveHovered}
                soundKey="settingsOpen"
              />
            )}

            <ActionButton
              icon={LogOut}
              label={t('Leave party')}
              subtitle={t('Disconnect from session')}
              onClick={handleLeaveParty}
              variant="leave"
              collapsed={isQueueHovered}
              onHoverChange={handleLeaveHoverChange}
            />
          </div>
        )}
      </div>
      {passwordPrompt && (
        <AttendeePasswordPrompt
          reason={passwordPrompt.reason}
          onClose={() => setPasswordPrompt(null)}
          onSkip={async () => {
            const afterSkip = passwordPrompt.afterSkip;
            setPasswordPrompt(null);
            if (afterSkip) await afterSkip();
          }}
          onSaved={async () => {
            const afterSave = passwordPrompt.afterSave;
            setPasswordPrompt(null);
            if (afterSave) await afterSave();
          }}
        />
      )}
    </TooltipProvider>
  );
}

interface CurrentSong {
  _id: string;
  title: string;
  artist: string;
}

const getVoteSettings = (event: unknown): EventSettings => {
  const settings = (event as { settings?: EventSettings } | null)?.settings;
  return settings && typeof settings === 'object' ? settings : {};
};

function VotingButtons() {
  const { playSound } = useSound();
  const { error, info, success } = useToast();
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [voteSettings, setVoteSettings] = useState<EventSettings>({});
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string; settings?: EventSettings }>('currentEvent');
    const eventId = event?.eventId || event?._id || event?.id;
    if (!eventId) return;

    setVoteSettings(getVoteSettings(event));

    songsAPI
      .getQueue(eventId)
      .then((queue) => {
        if (queue && queue.length > 0) {
          setCurrentSong(queue[0]);
        }
      })
      .catch(() => {
        /* queue fetch failed silently */
      });

    eventsAPI
      .getEvent(eventId)
      .then((freshEvent) => setVoteSettings(getVoteSettings(freshEvent)))
      .catch(() => {
        /* event settings refresh failed silently */
      });

    const handleQueueUpdate = (data: QueueUpdatedPayload) => {
      if (data.queue && data.queue.length > 0) {
        setCurrentSong(data.queue[0]);
      } else {
        setCurrentSong(null);
      }
    };
    const handleEventUpdate = (data: { event?: unknown }) => {
      setVoteSettings(getVoteSettings(data.event));
    };

    try {
      socket.onQueueUpdated(handleQueueUpdate);
      socket.onEventUpdated(handleEventUpdate);
    } catch {
      /* socket not initialized */
    }

    return () => {
      try {
        socket.off('queue_updated', handleQueueUpdate);
        socket.off('event_updated', handleEventUpdate);
      } catch {
        /* socket already gone */
      }
    };
  }, []);

  const handleVote = async (value: 1 | -1) => {
    if (voteSettings.votingEnabled === false) {
      info(t('Voting is disabled for this event'));
      return;
    }
    if (value === -1 && voteSettings.allowDownvotes === false) {
      info(t('Downvotes are disabled for this event'));
      return;
    }
    if (!currentSong) {
      info(t('No song playing'));
      return;
    }
    if (voting) return;

    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    if (!event || !participant) {
      error(t('Session data missing'));
      return;
    }

    const eventId = event.eventId || event._id || event.id;
    const participantId = participant._id || participant.id;
    if (!eventId || !participantId) {
      error(t('Session data missing'));
      return;
    }

    playSound(value === 1 ? 'voteUp' : 'voteDown');
    setVoting(true);
    try {
      await socket.castVote(eventId, currentSong._id, participantId, value);
      success(value === 1 ? t('Track boosted') : t('Track lowered'));
    } catch (err: unknown) {
      error(getErrorMessage(err, t('Vote failed')));
    } finally {
      setVoting(false);
    }
  };

  const votingDisabled = voting || voteSettings.votingEnabled === false;
  const downvoteDisabled = votingDisabled || voteSettings.allowDownvotes === false;

  return (
    <div className="flex w-full justify-center gap-4 lg:gap-3">
      <VoteButton
        icon={ArrowUp}
        color="emerald"
        label={t('Vote Up')}
        onClick={() => handleVote(1)}
        disabled={!currentSong || votingDisabled}
      />
      <VoteButton
        icon={ArrowDown}
        color="red"
        label={t('Vote Down')}
        onClick={() => handleVote(-1)}
        disabled={!currentSong || downvoteDisabled}
      />
    </div>
  );
}

interface VoteButtonProps {
  icon: React.ElementType;
  color: 'emerald' | 'red';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function VoteButton({
  icon: Icon,
  color,
  label,
  onClick,
  disabled,
}: VoteButtonProps) {
  const { playSound } = useSound();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <m.button
          type="button"
          aria-label={label}
          whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          onClick={onClick}
          onHoverStart={() => !disabled && playSound('buttonHover')}
          disabled={disabled}
          transition={{ duration: ANIMATION_DURATION.fast }}
          className={`group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border outline-none transition-all focus-visible:ring-4 md:h-[72px] md:w-[72px] lg:h-14 lg:w-14 ${VOTE_BUTTON_COLORS[color].button} ${disabled ? 'cursor-not-allowed opacity-45 grayscale' : ''}`}
        >
          <span className="absolute inset-1 rounded-full border border-white/20" />
          <span
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 lg:h-10 lg:w-10 ${VOTE_BUTTON_COLORS[color].icon}`}
          >
            <Music2
              className={`absolute h-4 w-4 -translate-y-2.5 translate-x-2.5 opacity-85 ${VOTE_BUTTON_COLORS[color].accent}`}
              strokeWidth={2.2}
              aria-hidden="true"
            />
            <Icon size={28} strokeWidth={2.8} aria-hidden="true" />
          </span>
        </m.button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  onClick: () => void;
  variant: 'queue' | 'settings' | 'friends' | 'leave';
  queueTone?: 'attendee' | 'dj';
  collapsed?: boolean;
  iconOnly?: boolean;
  onHoverChange?: (isHovered: boolean) => void;
  soundKey?: string;
}

function ActionButton({
  icon: Icon,
  label,
  subtitle,
  onClick,
  variant,
  queueTone,
  collapsed,
  iconOnly,
  onHoverChange,
  soundKey,
}: ActionButtonProps) {
  const { playSound } = useSound();

  const activateActionButton = () => {
    if (soundKey) {
      playSound(soundKey);
    }
    onClick();
  };

  const handleHoverStart = () => {
    playSound('buttonHover');
    onHoverChange?.(true);
  };

  const handleHoverEnd = () => {
    onHoverChange?.(false);
  };
  const styles = {
    queue:
      queueTone === 'dj'
        ? 'border-transparent bg-[radial-gradient(circle_at_82%_20%,rgba(98,175,255,0.9),transparent_34%),linear-gradient(135deg,#1e63f4_0%,#2f7cff_52%,#3d91ff_100%)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:ring-blue-100'
        : 'border-transparent bg-[radial-gradient(circle_at_82%_20%,rgba(67,210,170,0.92),transparent_34%),linear-gradient(135deg,#129a73_0%,#1abd88_52%,#31c99b_100%)] text-white shadow-[0_12px_24px_rgba(26,189,136,0.28),inset_0_1px_0_rgba(255,255,255,0.24)] focus-visible:ring-emerald-100',
    settings:
      'border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-[#17213a] shadow-[0_10px_22px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-slate-900/15 focus-visible:ring-blue-100',
    friends:
      'border-transparent bg-[linear-gradient(135deg,#2563eb_0%,#0f9f8f_100%)] text-white shadow-[0_12px_24px_rgba(20,184,166,0.24),inset_0_1px_0_rgba(255,255,255,0.24)] focus-visible:ring-cyan-100',
    leave:
      'border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-[#ff4f66] shadow-[0_10px_22px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-rose-200 focus-visible:ring-rose-100',
  };
  const expandedWidth = {
    queue: 'sm:hover:w-[360px] sm:focus-visible:w-[360px]',
    settings: 'sm:hover:w-[300px] sm:focus-visible:w-[300px]',
    friends: 'sm:hover:w-[300px] sm:focus-visible:w-[300px]',
    leave: 'sm:hover:w-[288px] sm:focus-visible:w-[288px]',
  }[variant];

  if (collapsed) {
    return <span className="h-[62px] w-16 flex-shrink-0" aria-hidden="true" />;
  }

  return (
    <m.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={activateActionButton}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className={`group relative flex h-[62px] w-16 will-change-[width,transform] items-center justify-center gap-0 overflow-hidden rounded-xl border px-0 font-sans outline-none transition-[width,transform,border-color] duration-100 ease-out sm:hover:delay-75 sm:focus-visible:delay-0 focus-visible:ring-4 ${iconOnly ? '' : expandedWidth} ${styles[variant]}`}
    >
      {iconOnly ? (
        <m.span
          className="flex-shrink-0"
          whileHover={{ rotate: 45 }}
          transition={{ duration: ANIMATION_DURATION.fast }}
        >
          <Icon
            size={variant === 'queue' ? 27 : 24}
            strokeWidth={2}
            aria-hidden="true"
          />
        </m.span>
      ) : (
        <Icon
          className="flex-shrink-0"
          size={variant === 'queue' ? 27 : 24}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
      {!iconOnly && (
        <span className="ml-0 flex max-w-0 min-w-0 flex-col items-start overflow-hidden whitespace-nowrap leading-none opacity-0 transition-[max-width,margin-left,opacity] duration-100 ease-out group-hover:ml-5 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:ml-5 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100">
          <span className="text-[13px] font-extrabold tracking-normal">
            {label}
          </span>
          <span
            className={`mt-2 truncate text-[11px] font-semibold ${
              variant === 'leave'
                ? 'text-rose-400/80'
                : variant === 'settings'
                  ? 'text-slate-500'
                  : 'text-white/75'
            }`}
          >
            {subtitle}
          </span>
        </span>
      )}
    </m.button>
  );
}
