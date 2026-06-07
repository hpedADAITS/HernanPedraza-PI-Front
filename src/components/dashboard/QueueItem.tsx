import React, { useState, type MouseEvent } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Play, X, Clock, UserX, SkipForward, Check, Mic } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DEFAULT_COOLDOWN_MS, formatCooldownDuration } from '@/constants/cooldowns';
import { CooldownDurationSelect } from './CooldownDurationSelect';
import { ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI } from '@/services/api';
import { useSound } from '@/hooks/useSound';
import { setCooldownAck, kickParticipantAck } from '@/services/socket/emitters';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';
import type { Song } from '@/types/songs';
import type { RemovalReason } from '@/features/dashboard/useQueueRealtime';

export interface QueueItemContext {
  first: boolean;
  mode: 'attendee' | 'dj';
  selected: boolean;
  mine: boolean;
}

export interface QueueItemProps {
  song: Song;
  position: number;
  context: QueueItemContext;
  primaryColor: string;
  onSelect: (id: string) => void;
  onSongRemoved: (songId: string, reason?: RemovalReason) => void;
  eventId?: string;
  isDarkMode?: boolean;
  waitSeconds?: number;
  djUserId?: string | null;
  djParticipantId?: string | null;
}

function isRequestedByDj(song: Song, djUserId: string | null, djParticipantId: string | null) {
  const requesterId = song.requestedBy?._id;
  return !!requesterId && (requesterId === djUserId || requesterId === djParticipantId);
}

function isMatchRequiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: string; error?: { code?: string } | string; message?: string };
  if (candidate.code === 'MATCH_REQUIRED') return true;
  if (typeof candidate.error === 'object' && candidate.error !== null && candidate.error.code === 'MATCH_REQUIRED') {
    return true;
  }
  return typeof candidate.message === 'string' && /fingerprint match/i.test(candidate.message);
}

function formatWait(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function QueueItem({
  song,
  position,
  context,
  primaryColor,
  onSelect,
  onSongRemoved,
  eventId,
  isDarkMode = false,
  waitSeconds,
  djUserId = null,
  djParticipantId = null,
}: QueueItemProps) {
  const isDj = context.mode === 'dj';
  const [cooldownMs, setCooldownMs] = useState(DEFAULT_COOLDOWN_MS);
  const { playSound } = useSound();
  const { toast } = useToast();
  const canModerateRequester = !!song.requestedBy?._id && !isRequestedByDj(song, djUserId, djParticipantId);
  // Send Now is only allowed once a fingerprint trackId is bound to the song.
  // Until the audio fingerprinting pipeline (or a manual fingerprint pick)
  // assigns a trackId, the server will reject the push.
  const hasMatchedTrack = Boolean(song.recognitionMatch?.trackId);
  const canSendNow = hasMatchedTrack && song.status !== 'PLAYING';

  const handleAdminAction = async (action: string, e: MouseEvent) => {
    e.stopPropagation();
    playSound(
      action === 'Cooldown'
        ? 'cooldown'
        : action === 'Reject' || action === 'Kick'
          ? 'cancelAction'
          : 'approveSong',
    );

    try {
      const songId = song._id;

      if (action === 'Approve' && eventId) {
        if (!songId) {
          toast.error(t('Song ID not found'));
          return;
        }
        await songsAPI.approveSong(eventId, songId);
        toast.success(t('Queued "{title}"', { title: song.title }));
      } else if (action === 'Send Now' && eventId) {
        if (!songId) {
          toast.error(t('Song ID not found'));
          return;
        }
        if (!canSendNow) {
          toast.error(t('Send Now needs a fingerprint match. Connect a microphone and wait for the audio fingerprinting to match this track.'));
          return;
        }
        try {
          await songsAPI.sendNow(eventId, songId);
          onSongRemoved(songId);
          toast.success(t('Now playing "{title}"', { title: song.title }));
          return;
        } catch (sendNowError) {
          if (isMatchRequiredError(sendNowError)) {
            toast.error(t('Send Now needs a fingerprint match. Connect a microphone and wait for the audio fingerprinting to match this track.'));
          } else {
            throw sendNowError;
          }
          return;
        }
      } else if (action === 'Reject' && eventId) {
        if (!songId) {
          toast.error(t('Song ID not found'));
          return;
        }
        await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
        onSongRemoved(songId, 'rejected');
        toast.success(t('Rejected "{title}"', { title: song.title }));
      } else if (action === 'Cooldown' && eventId) {
        if (!canModerateRequester || !song.requestedBy?._id) {
          toast.error(t('Only attendee requests can be moderated'));
          return;
        }
        await setCooldownAck(eventId, song.requestedBy._id, cooldownMs, 'DJ applied cooldown');
        toast.success(t('User on cooldown for {duration}', { duration: formatCooldownDuration(cooldownMs) }));
      } else if (action === 'Kick' && eventId) {
        if (!canModerateRequester || !song.requestedBy?._id) {
          toast.error(t('Only attendee requests can be moderated'));
          return;
        }
        await kickParticipantAck(eventId, song.requestedBy._id, 'Kicked by DJ');
        toast.success(t('User kicked from event'));
      } else if (action === 'Skip' && eventId) {
        if (!songId) {
          toast.error(t('Song ID not found'));
          return;
        }
        await songsAPI.skipSong(eventId, songId, 'Skipped by DJ');
        onSongRemoved(songId, 'skipped');
        toast.success(t('Skipped "{title}"', { title: song.title }));
      } else if (action === 'Play Next') {
        if (!eventId) {
          toast.error(t('Event ID not found'));
          return;
        }
        const played = await songsAPI.playNext(eventId);
        if (played) {
          toast.success(t('Now playing "{title}"', { title: played.title }));
        } else {
          toast.error(t('No songs in queue to play'));
        }
      } else {
        console.error(
          `[ERROR] Action "${action}" failed - eventId: ${eventId}, songId: ${songId}`,
        );
        toast.error(t('Invalid action or missing event ID'));
      }
    } catch (error) {
      console.error('Admin action failed:', error);
      toast.error(t('Failed to {action}', { action: t(action.toLowerCase()) }));
    }
  };

  return (
    <m.div
      layout
      initial={{ opacity: 1, x: 0 }}
      exit={{
        opacity: 0,
        x: 20,
        scale: 0.98,
        transition: { duration: 0.2 },
      }}
      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.7)' }}
      transition={{ duration: ANIMATION_DURATION.fast }}
      onClick={() => isDj && onSelect(song._id)}
      className={clsx(
        'flex items-center gap-4 lg:gap-3 group cursor-pointer p-3 lg:p-2 rounded-xl transition-all',
        isDj ? 'cursor-pointer hover:bg-slate-50' : '',
      )}
    >
      {/* Position Badge */}
      <div
        className={clsx(
          'w-12 h-12 lg:w-10 lg:h-10 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg lg:text-base flex-shrink-0',
          context.first ? primaryColor : 'bg-slate-400',
        )}
      >
        {position}
      </div>

      {/* Song Info or Admin Controls */}
      <AnimatePresence mode="wait">
        {context.selected && isDj ? (
          <m.div
            key="admin-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex items-center gap-2"
          >
            <CooldownDurationSelect
              value={cooldownMs}
              onClick={(e) => e.stopPropagation()}
              onChange={setCooldownMs}
              disabled={!canModerateRequester}
              className={clsx(
                'h-9 rounded-lg border px-2 text-xs font-bold outline-none disabled:cursor-not-allowed disabled:opacity-40',
                isDarkMode
                  ? 'border-yellow-800/40 bg-slate-900 text-yellow-300'
                  : 'border-yellow-200 bg-white text-yellow-800',
              )}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Approve', e)}
                  disabled={song.status === 'PLAYING'}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    song.status === 'PLAYING'
                      ? 'opacity-30 cursor-not-allowed'
                      : isDarkMode
                        ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
                  )}
                >
                  <Check size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>{t('Approve (Add to Queue)')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Send Now', e)}
                  disabled={!canSendNow}
                  aria-disabled={!canSendNow}
                  className={clsx(
                    'p-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    isDarkMode
                      ? 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
                  )}
                >
                  <Play size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>
                {canSendNow
                  ? t('Send Song Now')
                  : t('Waiting for microphone to match this track')}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Reject', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-red-900/30 hover:bg-red-800/40 text-red-300'
                      : 'bg-red-100 hover:bg-red-200 text-red-700',
                  )}
                >
                  <X size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>{t('Reject Song')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Cooldown', e)}
                  disabled={!canModerateRequester}
                  className={clsx(
                    'p-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    isDarkMode
                      ? 'bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300'
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
                  )}
                >
                  <Clock size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>{t('Cooldown User')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Skip', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-gray-900/30 hover:bg-gray-800/40 text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                  )}
                >
                  <SkipForward size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>{t('Skip Song')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Kick', e)}
                  disabled={!canModerateRequester}
                  className={clsx(
                    'p-2 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                    isDarkMode
                      ? 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-300'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700',
                  )}
                >
                  <UserX size={18} />
                </m.button>
              </TooltipTrigger>
              <TooltipContent>{t('Kick User')}</TooltipContent>
            </Tooltip>
          </m.div>
        ) : (
          <m.div
            key="song-info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            className="flex-1 flex items-center gap-4"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <span
                className={clsx(
                  'font-semibold truncate',
                  isDarkMode ? 'text-slate-100' : 'text-slate-800',
                )}
              >
                {song.title}
                {context.mine && (
                  <span
                    className={clsx(
                      'ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider',
                      isDarkMode
                        ? 'bg-emerald-900/40 text-emerald-300'
                        : 'bg-emerald-100 text-emerald-700',
                    )}
                  >
                    You
                  </span>
                )}
                {isDj && !hasMatchedTrack && song.status !== 'PLAYING' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <m.span
                        role="img"
                        aria-label={t('Waiting for microphone to match this track')}
                        animate={{ opacity: [0.55, 1, 0.55], scale: [1, 1.08, 1] }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.55)] align-middle"
                      >
                        <Mic size={12} aria-hidden="true" />
                      </m.span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('Waiting for microphone to match this track')}
                    </TooltipContent>
                  </Tooltip>
                )}
              </span>
              <span
                className={clsx(
                  'text-xs',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                {song.artist}
              </span>
              {!isDj && waitSeconds != null && song.status !== 'PLAYING' && (
                <span
                  className={clsx(
                    'text-[11px] flex items-center gap-1 mt-0.5',
                    context.mine
                      ? isDarkMode
                        ? 'text-emerald-300 font-semibold'
                        : 'text-emerald-700 font-semibold'
                      : isDarkMode
                        ? 'text-slate-400'
                        : 'text-slate-500',
                  )}
                >
                  <Clock size={11} />
                  {waitSeconds <= 0 ? 'Up next' : `~${formatWait(waitSeconds)}`}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-1">
              <span
                className={clsx(
                  'text-sm font-semibold',
                  isDarkMode ? 'text-slate-100' : 'text-slate-700',
                )}
              >
                {song.voteScore}
              </span>
              <span
                className={clsx(
                  'text-xs',
                  isDarkMode ? 'text-slate-400' : 'text-slate-400',
                )}
              >
                votes
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}
