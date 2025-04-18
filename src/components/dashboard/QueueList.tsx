import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Play, X, Clock, UserX, SkipForward, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_UP, ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, eventsAPI, participantsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { DEBUG_EVENT_NAME } from '@/components/debug/SongCardDebugModal';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { readStoredJson } from '@/utils/storage';
import type { Song } from '@/types/songs';

type RemovalReason = 'rejected' | 'skipped' | 'played';

function formatWait(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

interface QueueListProps {
  mode: 'attendee' | 'dj';
  eventId?: string;
  participantId?: string;
  isDarkMode?: boolean;
}

export function QueueList({
  mode,
  eventId: propEventId,
  participantId: propParticipantId,
  isDarkMode = false,
}: QueueListProps) {
  const isDj = mode === 'dj';
  const primaryColor = THEME_CONFIG[isDj ? 'dj' : 'attendee'].primaryColor;
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(propEventId || null);
  const [participantId, setParticipantId] = useState<string | null>(
    propParticipantId || null,
  );
  const [nowPlaying, setNowPlaying] = useState<{
    songId: string;
    duration: number;
    startedAt: number;
  } | null>(null);
  const [fallingCards, setFallingCards] = useState<
    Array<{ id: string; song: Song; reason: RemovalReason }>
  >([]);
  const [tick, setTick] = useState(0);

  /* Tick every second to refresh per-attendee wait times */
  useEffect(() => {
    if (mode !== 'attendee' || !nowPlaying) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [mode, nowPlaying?.songId]);

  const removeSong = useCallback(
    (songId: string, reason: RemovalReason = 'played') => {
      setSongs((prev) => {
        const removed = prev.find((s) => s._id === songId);
        if (removed && (reason === 'rejected' || reason === 'skipped')) {
          const id = `${songId}-${reason}-${Date.now()}`;
          setFallingCards((cards) => [...cards, { id, song: removed, reason }]);
          window.setTimeout(() => {
            setFallingCards((cards) => cards.filter((card) => card.id !== id));
          }, 1300);
        }
        return prev.filter((s) => s._id !== songId);
      });
      setSelectedSongId((prev) => (prev === songId ? null : prev));
    },
    [],
  );

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const eventData = readStoredJson<{ eventId?: string; eventCode?: string }>('currentEvent');
        const participantData = readStoredJson<{ _id?: string }>('currentParticipant');

        if (!eventData) {
          setLoading(false);
          return;
        }

        let resolvedEventId = propEventId || eventData.eventId;
        const eventCode = eventData.eventCode;

        if (!resolvedEventId) {
          const event = await eventsAPI.getEventByAccessCode(eventCode);
          if (!event) {
            setLoading(false);
            return;
          }
          resolvedEventId = event._id;
        }

        setEventId(resolvedEventId);

        if (participantData) {
          setParticipantId(propParticipantId || participantData._id || null);
        }

        const queue = await songsAPI.getQueue(resolvedEventId);
        setSongs(queue || []);
      } catch (error) {
        console.error('Error fetching queue:', error);
        toast.error('Failed to load queue');
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [propEventId, propParticipantId]);

  useEffect(() => {
    const handleQueued = (data: any) => {
      /* Song was approved into the queue. Add or update. */
      if (!data?.songId) return;
      setSongs((prev) => {
        const exists = prev.some((s) => s._id === data.songId);
        const incoming: Song = {
          _id: data.songId,
          title: data.title,
          artist: data.artist,
          voteScore: 0,
          status: 'QUEUED',
          duration: data.duration,
          queuePosition: data.queuePosition,
          requestedBy: data.requestedBy,
        };
        if (exists) {
          return prev.map((s) =>
            s._id === data.songId ? { ...s, ...incoming } : s,
          );
        }
        return [...prev, incoming];
      });
    };
    const handleNowPlaying = (data: any) => {
      if (!data?.songId) return;
      removeSong(data.songId);
      const startedAt = data.playingStartedAt
        ? new Date(data.playingStartedAt).getTime()
        : Date.now();
      setNowPlaying({
        songId: data.songId,
        duration: data.duration || 0,
        startedAt,
      });
    };
    const handleRejected = (data: any) => {
      if (data?.songId) removeSong(data.songId, 'rejected');
    };
    const handleSkipped = (data: any) => {
      if (data?.songId) removeSong(data.songId, 'skipped');
    };
    const handleVotesUpdated = (data: any) => {
      if (data?.songId && data?.voteScore != null) {
        setSongs((prev) =>
          prev.map((s) =>
            s._id === data.songId ? { ...s, voteScore: data.voteScore } : s,
          ),
        );
      }
      /* Apply position recalculations from backend */
      if (Array.isArray(data?.affectedSongs)) {
        setSongs((prev) =>
          prev.map((s) => {
            const upd = data.affectedSongs.find((a: any) => a.songId === s._id);
            return upd ? { ...s, queuePosition: upd.queuePosition } : s;
          }),
        );
      }
    };
    const handleQueueUpdated = (data: any) => {
      if (Array.isArray(data?.queue)) {
        setSongs(data.queue);
      }
      if (data?.nowPlaying?.songId) {
        const np = data.nowPlaying;
        const startedAt = np.playingStartedAt
          ? new Date(np.playingStartedAt).getTime()
          : Date.now() - (np.elapsedTime || 0) * 1000;
        setNowPlaying({
          songId: np.songId,
          duration: np.duration || 0,
          startedAt,
        });
      }
    };

    try {
      socket.onSongQueued(handleQueued);
      socket.onSongNowPlaying(handleNowPlaying);
      socket.onSongRejected(handleRejected);
      socket.onSongSkipped(handleSkipped);
      socket.onVotesUpdated(handleVotesUpdated);
      socket.onQueueUpdated(handleQueueUpdated);
    } catch {
      /* Socket not initialized yet — listeners will be missed, but no crash */
    }

    const handleDebugSongEvent = (event: Event) => {
      const { type, payload } = (event as CustomEvent).detail || {};
      if (type === 'song_approved') handleQueued(payload);
      if (type === 'song_now_playing') handleNowPlaying(payload);
      if (type === 'song_rejected') handleRejected(payload);
      if (type === 'song_skipped') handleSkipped(payload);
      if (type === 'queue_updated') handleQueueUpdated(payload);
    };

    if (isDebugModeEnabled()) {
      window.addEventListener(DEBUG_EVENT_NAME, handleDebugSongEvent);
    }

    return () => {
      socket.off('song_approved', handleQueued);
      socket.off('song_now_playing', handleNowPlaying);
      socket.off('song_rejected', handleRejected);
      socket.off('song_skipped', handleSkipped);
      socket.off('votes_updated', handleVotesUpdated);
      socket.off('queue_updated', handleQueueUpdated);
      window.removeEventListener(DEBUG_EVENT_NAME, handleDebugSongEvent);
    };
  }, [removeSong]);

  /* Sort: PLAYING first, then QUEUED by voteScore desc (defensive — backend should sort too) */
  const sortedSongs = useMemo(() => {
    const order: Record<string, number> = {
      PLAYING: 0,
      QUEUED: 1,
      PENDING: 2,
    };
    return songs.toSorted((a, b) => {
      const ao = order[a.status as string] ?? 99;
      const bo = order[b.status as string] ?? 99;
      if (ao !== bo) return ao - bo;
      return (b.voteScore || 0) - (a.voteScore || 0);
    });
  }, [songs]);

  /* Compute cumulative wait time for each queued song (for attendees) */
  const waitTimes = useMemo(() => {
    if (mode !== 'attendee') return new Map<string, number>();
    const map = new Map<string, number>();
    let cumulative = 0;
    if (nowPlaying) {
      const elapsed = Math.max(0, (Date.now() - nowPlaying.startedAt) / 1000);
      cumulative = Math.max(0, nowPlaying.duration - elapsed);
    }
    void tick; // dependency for live update
    for (const s of sortedSongs) {
      if (s.status === 'PLAYING') continue;
      map.set(s._id, cumulative);
      cumulative += s.duration || 0;
    }
    return map;
  }, [sortedSongs, nowPlaying, mode, tick]);

  return (
    <TooltipProvider>
      <motion.div
        {...SLIDE_UP}
        transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
        layout
        className={clsx(
          'backdrop-blur-xl rounded-3xl p-7 lg:p-6 shadow-xl flex-1 min-h-0 flex flex-col overflow-hidden',
        )}
        style={{
          backgroundColor: isDarkMode
            ? 'rgba(100, 116, 139, 0.8)'
            : 'rgba(255, 255, 255, 0.6)',
        }}
      >
        <AnimatePresence>
          {fallingCards.map((card, index) => (
            <FallingQueueCard
              key={card.id}
              song={card.song}
              reason={card.reason}
              index={index}
              isDarkMode={isDarkMode}
            />
          ))}
        </AnimatePresence>

        <h3
          className={clsx(
          'font-bold mb-5 lg:mb-4 uppercase text-xs tracking-wider',
            isDarkMode ? 'text-slate-300' : 'text-slate-500',
          )}
        >
          Up Next
        </h3>

        <motion.div
          layout
          transition={{ type: 'spring', stiffness: 380, damping: 42 }}
          className="flex min-h-0 flex-1 flex-col gap-5 lg:gap-3 overflow-y-auto pr-1"
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" layout className="text-slate-500 py-4">
                Loading queue...
              </motion.div>
            ) : sortedSongs.length > 0 ? (
              <motion.div
                key="queue-list"
                layout
                className="flex flex-col gap-5 lg:gap-3"
              >
                <AnimatePresence>
                  {sortedSongs.map((song, i) => {
                    const isMine =
                      !!participantId &&
                      song.requestedBy?._id === participantId;
                    const wait = waitTimes.get(song._id);
                    return (
                      <QueueItem
                        key={song._id}
                        song={song}
                        position={song.queuePosition ?? i + 1}
                        isFirst={i === 0}
                        primaryColor={primaryColor}
                        isDj={isDj}
                        isSelected={selectedSongId === song._id}
                        onSelect={(id) =>
                          setSelectedSongId(selectedSongId === id ? null : id)
                        }
                        onSongRemoved={removeSong}
                        eventId={eventId || undefined}
                        isDarkMode={isDarkMode}
                        waitSeconds={wait}
                        isMine={isMine}
                      />
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                layout
                className="text-slate-500 py-4"
              >
                No songs in queue
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </TooltipProvider>
  );
}

interface QueueItemProps {
  song: Song;
  position: number;
  isFirst: boolean;
  primaryColor: string;
  isDj: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onSongRemoved: (songId: string, reason?: RemovalReason) => void;
  eventId?: string;
  isDarkMode?: boolean;
  waitSeconds?: number;
  isMine?: boolean;
}

function QueueItem({
  song,
  position,
  isFirst,
  primaryColor,
  isDj,
  isSelected,
  onSelect,
  onSongRemoved,
  eventId,
  isDarkMode = false,
  waitSeconds,
  isMine = false,
}: QueueItemProps) {
  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const songId = song._id;

      if (action === 'Approve' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.approveSong(eventId, songId);
        socket.approveSong(eventId, songId);
        toast.success(`Queued "${song.title}"`);
      } else if (action === 'Send Now' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.sendNow(eventId, songId);
        socket.sendNowSong(eventId, songId, song.title, song.artist);
        onSongRemoved(songId);
        toast.success(`Now playing "${song.title}"`);
      } else if (action === 'Reject' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
        socket.rejectSong(eventId, songId, 'Rejected by DJ');
        onSongRemoved(songId, 'rejected');
        toast.success(`Rejected "${song.title}"`);
      } else if (action === 'Cooldown' && eventId) {
        if (song.requestedBy?._id) {
          await participantsAPI.setCooldown(
            song.requestedBy._id,
            300000,
            'DJ applied cooldown',
          );
          toast.success('User on cooldown');
        }
      } else if (action === 'Kick' && eventId) {
        if (song.requestedBy?._id) {
          await participantsAPI.kickParticipant(
            song.requestedBy._id,
            'Kicked by DJ',
          );
          toast.success('User kicked from event');
        }
      } else if (action === 'Skip' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.skipSong(eventId, songId, 'Skipped by DJ');
        socket.skipSong(eventId, songId, 'Skipped by DJ');
        onSongRemoved(songId, 'skipped');
        toast.success(`Skipped "${song.title}"`);
      } else {
        console.error(
          `[ERROR] Action "${action}" failed - eventId: ${eventId}, songId: ${songId}`,
        );
        toast.error('Invalid action or missing event ID');
      }
    } catch (error) {
      console.error('Admin action failed:', error);
      toast.error(`Failed to ${action.toLowerCase()}`);
    }
  };

  return (
    <motion.div
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
          isFirst ? primaryColor : 'bg-slate-400',
        )}
      >
        {position}
      </div>

      {/* Song Info or Admin Controls */}
      <AnimatePresence mode="wait">
        {isSelected && isDj ? (
          <motion.div
            key="admin-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex items-center gap-2"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Approve', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700',
                  )}
                >
                  <Check size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Approve (Add to Queue)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Send Now', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-300'
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
                  )}
                >
                  <Play size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Send Song Now</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
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
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Reject Song</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Cooldown', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-yellow-900/30 hover:bg-yellow-800/40 text-yellow-300'
                      : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
                  )}
                >
                  <Clock size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Cooldown User</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
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
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Skip Song</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => handleAdminAction('Kick', e)}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    isDarkMode
                      ? 'bg-purple-900/30 hover:bg-purple-800/40 text-purple-300'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-700',
                  )}
                >
                  <UserX size={18} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Kick User</TooltipContent>
            </Tooltip>
          </motion.div>
        ) : (
          <motion.div
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
                {isMine && (
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
                    isMine
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
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FallingQueueCardProps {
  song: Song;
  reason: RemovalReason;
  index: number;
  isDarkMode: boolean;
}

function FallingQueueCard({
  song,
  reason,
  index,
  isDarkMode,
}: FallingQueueCardProps) {
  const isRejected = reason === 'rejected';

  return (
    <motion.div
      className={clsx(
        'pointer-events-none fixed left-1/2 top-28 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border p-4 shadow-2xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-900/90 text-slate-100'
          : 'border-slate-200 bg-white/95 text-slate-800',
      )}
      initial={{
        opacity: 0,
        y: -10,
        rotate: index % 2 === 0 ? -2 : 2,
        scale: 0.98,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-10, 18, 260],
        x: [0, index % 2 === 0 ? -12 : 12, index % 2 === 0 ? -36 : 36],
        rotate: index % 2 === 0 ? [-2, 3, -7] : [2, -3, 7],
        scale: [0.98, 1, 0.94],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeIn' }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white',
            isRejected ? 'bg-rose-500' : 'bg-slate-500',
          )}
        >
          {isRejected ? <X size={18} /> : <SkipForward size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{song.title}</p>
          <p
            className={clsx(
              'truncate text-xs',
              isDarkMode ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {isRejected ? 'Rejected by votes' : 'Skipped from the queue'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
