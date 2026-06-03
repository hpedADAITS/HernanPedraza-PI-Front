import React, { useState, useEffect, useRef } from 'react';
import { m } from 'motion/react';
import { ThumbsUp, ThumbsDown, LogOut, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, votesAPI, eventsAPI, participantsAPI, authAPI, clearToken } from '@/services/api';
import * as socket from '@/services/socket';
import { disconnectSocket } from '@/services/socket';
import { readStoredJson, removeStoredItem } from '@/utils/storage';
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

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const getCurrentParticipantId = () => {
  const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
  return participant?._id || participant?.id || null;
};

const VOTE_BUTTON_COLORS = {
  emerald: {
    button:
      'border-emerald-500 bg-emerald-600 text-white hover:border-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-200',
    icon: 'bg-white/15 group-hover:bg-white/20',
  },
  red: {
    button:
      'border-red-500 bg-red-600 text-white hover:border-red-600 hover:bg-red-700 focus-visible:ring-red-200',
    icon: 'bg-white/15 group-hover:bg-white/20',
  },
};

export function ActionButtons({
  mode,
  onNavigate,
  showVoting = true,
  showActions = true,
}: ActionButtonsProps) {
  const navigate = useViewNavigate(onNavigate);
  const { playSound } = useSound();
  const isDj = mode === 'dj';
  const [isQueueHovered, setIsQueueHovered] = useState(false);
  const queueHoverTimeoutRef = useRef<number | null>(null);
  const { clearTrackedTimeout, setTrackedTimeout } = useTrackedTimeout();
  const [passwordPrompt, setPasswordPrompt] = useState<{
    reason: 'leave' | 'duplicate-login';
    afterSave?: () => void;
    afterSkip?: () => void;
  } | null>(null);

  const handleQueueHoverChange = (nextHovered: boolean) => {
    if (queueHoverTimeoutRef.current) {
      clearTrackedTimeout(queueHoverTimeoutRef.current);
      queueHoverTimeoutRef.current = null;
    }

    if (!nextHovered) {
      setIsQueueHovered(false);
      return;
    }

    queueHoverTimeoutRef.current = setTrackedTimeout(() => {
      queueHoverTimeoutRef.current = null;
      setIsQueueHovered(true);
    }, 70);
  };

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
    if (isDj) {
      const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
      const eventId = event?.eventId || event?._id || event?.id || '';
      if (eventId) {
        try {
          await eventsAPI.endEvent(eventId);
        } catch (err: unknown) {
          toast.error(getErrorMessage(err, t('Failed to end event')));
        }
      }
    } else {
      const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
      const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
      if (event && participant) {
        const eventId = event.eventId || event._id || event.id;
        const participantId = participant._id || participant.id;
        if (eventId && participantId) {
          try {
            socket.leaveEvent(eventId, participantId);
          } catch {}
          await participantsAPI.leaveEvent(participantId);
        }
      }
    }
    clearToken();
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
        toast.error(getErrorMessage(err, t('Failed to remove profile picture')));
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

            <ActionButton
              icon={LogOut}
              label={t('Leave party')}
              subtitle={t('Disconnect from session')}
              onClick={handleLeaveParty}
              variant="leave"
              collapsed={isQueueHovered}
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

function VotingButtons() {
  const { playSound } = useSound();
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
    const eventId = event?.eventId || event?._id || event?.id;
    if (!eventId) return;

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

    const handleQueueUpdate = (data: QueueUpdatedPayload) => {
      if (data.queue && data.queue.length > 0) {
        setCurrentSong(data.queue[0]);
      } else {
        setCurrentSong(null);
      }
    };

    try {
      socket.onQueueUpdated(handleQueueUpdate);
    } catch {
      /* socket not initialized */
    }

    return () => {
      try {
        socket.off('queue_updated', handleQueueUpdate);
      } catch {
        /* socket already gone */
      }
    };
  }, []);

  const handleVote = async (value: 1 | -1) => {
    if (!currentSong) {
      toast.info(t('No song playing'));
      return;
    }
    if (voting) return;

    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    if (!event || !participant) {
      toast.error(t('Session data missing'));
      return;
    }

    const eventId = event.eventId || event._id || event.id;
    const participantId = participant._id || participant.id;
    if (!eventId || !participantId) {
      toast.error(t('Session data missing'));
      return;
    }

    playSound(value === 1 ? 'voteUp' : 'voteDown');
    setVoting(true);
    try {
      await votesAPI.castVote(currentSong._id, participantId, value);
      const direction = value === 1 ? '👍' : '👎';
      toast.success(`${direction} ${currentSong.title}`);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('Vote failed')));
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex w-full justify-center gap-4 lg:gap-3">
      <VoteButton
        icon={ThumbsUp}
        color="emerald"
        label={t('Vote Up')}
        onClick={() => handleVote(1)}
        disabled={!currentSong || voting}
      />
      <VoteButton
        icon={ThumbsDown}
        color="red"
        label={t('Vote Down')}
        onClick={() => handleVote(-1)}
        disabled={!currentSong || voting}
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
          className={`group flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_12px_28px_rgba(15,23,42,0.16)] outline-none transition-all focus-visible:ring-4 md:h-[72px] md:w-[72px] lg:h-14 lg:w-14 ${VOTE_BUTTON_COLORS[color].button} ${disabled ? 'cursor-not-allowed opacity-45 grayscale' : ''}`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 lg:h-10 lg:w-10 ${VOTE_BUTTON_COLORS[color].icon}`}
          >
            <Icon size={28} strokeWidth={2.4} />
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
  variant: 'queue' | 'settings' | 'leave';
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

  const handleClick = () => {
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
    leave:
      'border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-[#ff4f66] shadow-[0_10px_22px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-rose-200 focus-visible:ring-rose-100',
  };
  const expandedWidth = {
    queue: 'sm:hover:w-[360px] sm:focus-visible:w-[360px]',
    settings: 'sm:hover:w-[300px] sm:focus-visible:w-[300px]',
    leave: 'sm:hover:w-[288px] sm:focus-visible:w-[288px]',
  }[variant];

  if (collapsed) return null;

  return (
    <m.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      onFocus={() => onHoverChange?.(true)}
      onBlur={() => onHoverChange?.(false)}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className={`group relative flex h-[62px] w-16 will-change-[width,transform] items-center justify-center gap-0 overflow-hidden rounded-xl border px-0 font-sans outline-none transition-[width,transform,border-color] duration-100 ease-out focus-visible:ring-4 ${iconOnly ? '' : expandedWidth} ${styles[variant]}`}
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
              variant === 'leave' ? 'text-rose-400/80' : 'text-white/75'
            }`}
          >
            {subtitle}
          </span>
        </span>
      )}
    </m.button>
  );
}
