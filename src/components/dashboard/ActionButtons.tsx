import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, LogOut, Settings, Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, votesAPI, eventsAPI, participantsAPI, clearToken } from '@/services/api';
import * as socket from '@/services/socket';
import { disconnectSocket } from '@/services/socket';
import { readStoredJson, removeStoredItem, writeStoredJson } from '@/utils/storage';
import type { View } from '@/types';

interface ActionButtonsProps {
  mode: 'attendee' | 'dj';
  onNavigate: (view: View) => void;
  showVoting?: boolean;
  showActions?: boolean;
}

export function ActionButtons({
  mode,
  onNavigate,
  showVoting = true,
  showActions = true,
}: ActionButtonsProps) {
  const isDj = mode === 'dj';
  const [passwordPrompt, setPasswordPrompt] = useState<{
    reason: 'leave' | 'duplicate-login';
    afterSave?: () => void;
  } | null>(null);

  useEffect(() => {
    if (isDj) return undefined;

    const handlePasswordPromptRequested = (data: any) => {
      const participant = readStoredJson<{ _id?: string; id?: string; passwordProtected?: boolean }>('currentParticipant');
      if (!participant) return;
      if ((participant._id || participant.id) !== data?.participantId) return;
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

  const isParticipantPasswordProtected = () => {
    const participant = readStoredJson<{ passwordProtected?: boolean }>('currentParticipant');
    return Boolean(participant?.passwordProtected);
  };

  const finishLeaveParty = async () => {
    if (isDj) {
      const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
      const eventId = event?.eventId || event?._id || event?.id || '';
      if (eventId) {
        try {
          await eventsAPI.endEvent(eventId);
        } catch (err: any) {
          toast.error(err?.message || 'Failed to end event');
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
    onNavigate(isDj ? 'dj-login' : 'attendee-login');
  };

  const handleLeaveParty = async () => {
    if (!isDj && !isParticipantPasswordProtected()) {
      setPasswordPrompt({ reason: 'leave', afterSave: finishLeaveParty });
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
              label="Queue a Song"
              subtitle="Add to the upcoming list"
              onClick={() =>
                onNavigate(isDj ? 'dj-song-select' : 'attendee-song-select')
              }
              variant="queue"
            />

            <ActionButton
              icon={LogOut}
              label="Leave Party"
              subtitle="Disconnect from session"
              onClick={handleLeaveParty}
              variant="leave"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  whileHover={{ y: -1, rotate: 45 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() =>
                    onNavigate(isDj ? 'dj-settings' : 'attendee-settings')
                  }
                  className="flex h-[62px] w-16 items-center justify-center rounded-xl border border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-[#17213a] shadow-[0_10px_22px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] outline-none transition-all hover:border-slate-900/15 hover:shadow-[0_14px_26px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] focus-visible:ring-4 focus-visible:ring-blue-100 sm:w-16"
                >
                  <Settings size={24} strokeWidth={2.1} aria-hidden="true" />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
      {passwordPrompt && (
        <AttendeePasswordPrompt
          reason={passwordPrompt.reason}
          onClose={() => setPasswordPrompt(null)}
          onSkip={async () => {
            const afterSave = passwordPrompt.afterSave;
            setPasswordPrompt(null);
            if (afterSave) await afterSave();
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

interface AttendeePasswordPromptProps {
  reason: 'leave' | 'duplicate-login';
  onClose: () => void;
  onSkip: () => void | Promise<void>;
  onSaved: () => void | Promise<void>;
}

function AttendeePasswordPrompt({
  reason,
  onClose,
  onSkip,
  onSaved,
}: AttendeePasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const title =
    reason === 'leave' ? 'Protect your attendee name?' : 'Someone tried your name';
  const message =
    reason === 'leave'
      ? 'Set a password before leaving so only you can reuse this nickname later.'
      : 'Add a password now so another device cannot take over your attendee name.';

  const handleSave = async () => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    if (!participant) {
      toast.error('No attendee session found');
      return;
    }

    setSaving(true);
    try {
      const participantId = participant._id || participant.id;
      const updated = await participantsAPI.setPassword(participantId, password);
      writeStoredJson('currentParticipant', {
        ...participant,
        ...updated,
        passwordProtected: true,
      });
      toast.success('Attendee name protected');
      await onSaved();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendee-password-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock size={18} />
          </div>
          <div>
            <h2
              id="attendee-password-title"
              className="text-base font-semibold text-slate-950"
            >
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-emerald-200"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            autoComplete="new-password"
            className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-emerald-200"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reason === 'leave' ? onSkip : onClose}
            className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {reason === 'leave' ? 'Leave without password' : 'Not now'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
          {saving ? 'Saving…' : 'Set password'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CurrentSong {
  _id: string;
  title: string;
  artist: string;
}

function VotingButtons() {
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

    const handleQueueUpdate = (data: any) => {
      if (data?.queue && data.queue.length > 0) {
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
      toast.info('No song playing');
      return;
    }
    if (voting) return;

    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    if (!event || !participant) {
      toast.error('Session data missing');
      return;
    }

    const eventId = event.eventId || event._id || event.id;
    const participantId = participant._id || participant.id;
    if (!eventId || !participantId) {
      toast.error('Session data missing');
      return;
    }

    setVoting(true);
    try {
      await votesAPI.castVote(currentSong._id, participantId, value);
      socket.castVote(eventId, currentSong._id, participantId, value);
      const direction = value === 1 ? '👍' : '👎';
      toast.success(`${direction} ${currentSong.title}`);
    } catch (err: any) {
      toast.error(err?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex w-full justify-center gap-4 lg:gap-3">
      <VoteButton
        icon={ThumbsUp}
        color="emerald"
        label="Vote Up"
        onClick={() => handleVote(1)}
        disabled={!currentSong || voting}
      />
      <VoteButton
        icon={ThumbsDown}
        color="red"
        label="Vote Down"
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
  const colors = {
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          type="button"
          aria-label={label}
          whileHover={disabled ? undefined : { y: -1, scale: 1.01 }}
          whileTap={disabled ? undefined : { scale: 0.99 }}
          onClick={onClick}
          disabled={disabled}
          transition={{ duration: ANIMATION_DURATION.fast }}
          className={`group flex h-16 w-16 items-center justify-center rounded-full border shadow-[0_12px_28px_rgba(15,23,42,0.16)] outline-none transition-all focus-visible:ring-4 md:h-[72px] md:w-[72px] lg:h-14 lg:w-14 ${colors[color].button} ${disabled ? 'cursor-not-allowed opacity-45 grayscale' : ''}`}
        >
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors md:h-12 md:w-12 lg:h-10 lg:w-10 ${colors[color].icon}`}
          >
            <Icon size={28} strokeWidth={2.4} />
          </span>
        </motion.button>
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
  variant: 'queue' | 'leave';
}

function ActionButton({
  icon: Icon,
  label,
  subtitle,
  onClick,
  variant,
}: ActionButtonProps) {
  const styles = {
    queue:
      'border-transparent bg-[radial-gradient(circle_at_82%_20%,rgba(98,175,255,0.9),transparent_34%),linear-gradient(135deg,#1e63f4_0%,#2f7cff_52%,#3d91ff_100%)] text-white shadow-[0_12px_24px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.28)] focus-visible:ring-blue-100',
    leave:
      'border-slate-900/10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-[#ff4f66] shadow-[0_10px_22px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.9)] hover:border-rose-200 focus-visible:ring-rose-100',
  };
  const expandedWidth =
    variant === 'queue'
      ? 'sm:hover:w-[360px] sm:focus-visible:w-[360px]'
      : 'sm:hover:w-[288px] sm:focus-visible:w-[288px]';

  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className={`group relative flex h-[62px] w-16 will-change-[width,transform] items-center justify-center gap-0 overflow-hidden rounded-xl border px-0 font-sans outline-none transition-[width,transform,border-color] duration-150 ease-out focus-visible:ring-4 ${expandedWidth} ${styles[variant]}`}
    >
      <Icon
        className="flex-shrink-0"
        size={variant === 'queue' ? 27 : 24}
        strokeWidth={2}
        aria-hidden="true"
      />
      <span className="ml-0 flex max-w-0 min-w-0 flex-col items-start overflow-hidden whitespace-nowrap leading-none opacity-0 transition-[max-width,margin-left,opacity] duration-150 ease-out group-hover:ml-5 group-hover:max-w-[220px] group-hover:opacity-100 group-focus-visible:ml-5 group-focus-visible:max-w-[220px] group-focus-visible:opacity-100">
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
    </motion.button>
  );
}
