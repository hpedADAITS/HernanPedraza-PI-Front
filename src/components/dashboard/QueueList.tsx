import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { Play, X, Clock, UserX, SkipForward, Check } from 'lucide-react';
import { toast } from 'sonner';
import {  Tooltip,  TooltipContent,  TooltipProvider,TooltipTrigger} from '@/components/ui/tooltip';
import { THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_UP, ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, eventsAPI, participantsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import { readStoredJson } from '@/utils/storage';
import type { Song } from '@/types/songs';

type RemovalReason = 'rejected' | 'skipped' | 'played';

function getCurrentDjUserId() {
  const user = readStoredJson<{ _id?: string; id?: string; role?: string }>('user');
  if (user?.role?.toLowerCase() !== 'dj') return null;
  return user._id ?? user.id ?? null;
}

function isRequestedByDj(song: Song, djUserId: string | null) {
  return !!djUserId && song.requestedBy?._id === djUserId;
}

function formatWait(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function getSongDuration(song?: Partial<Song> | null): number | undefined {
  const duration = song?.totalDuration ?? song?.duration;
  return Number.isFinite(duration) && duration != null ? duration : undefined;
}

interface QueueListProps {
  mode: 'attendee' | 'dj';
  eventId?: string;
  participantId?: string;
  isDarkMode?: boolean;
}

interface QueueState {
  songs: Song[];
  loading: boolean;
  selectedSongId: string | null;
  resolvedEventId: string | null;
  nowPlaying: {
    songId: string;
    duration: number;
    totalDuration?: number;
    startedAt: number;
  } | null;
}

function getInitialQueueState(initialEventId?: string): QueueState {
  const eventData = readStoredJson<{ eventId?: string }>('currentEvent');

  return {
    songs: [],
    loading: true,
    selectedSongId: null,
    resolvedEventId: initialEventId ?? eventData?.eventId ?? null,
    nowPlaying: null,
  };
}

function getNowPlayingSnapshot(
  nowPlaying?: {
    songId?: string;
    duration?: number;
    totalDuration?: number;
    playingStartedAt?: string;
    elapsedTime?: number;
  } | null,
) {
  if (!nowPlaying?.songId) return null;

  return {
    songId: nowPlaying.songId,
    duration: nowPlaying.totalDuration ?? nowPlaying.duration ?? 0,
    totalDuration: nowPlaying.totalDuration ?? nowPlaying.duration,
    startedAt: nowPlaying.playingStartedAt
      ? new Date(nowPlaying.playingStartedAt).getTime()
      : Date.now() - (nowPlaying.elapsedTime || 0) * 1000,
  };
}

export function QueueList({
  mode,
  eventId: propEventId,
  participantId: propParticipantId,
  isDarkMode = false,
}: QueueListProps) {
  const isDj = mode === 'dj';
  const primaryColor = THEME_CONFIG[isDj ? 'dj' : 'attendee'].primaryColor;
  const [queueState, setQueueState] = useState<QueueState>(() =>
    getInitialQueueState(propEventId),
  );
  const [fallingCards, setFallingCards] = useState<
    Array<{ id: string; song: Song; reason: RemovalReason }>
  >([]);
  const [tick, setTick] = useState(0);
  const participantId =
    propParticipantId ||
    readStoredJson<{ _id?: string }>('currentParticipant')?._id ||
    null;
  const djUserId = isDj ? getCurrentDjUserId() : null;

  /* Tick every second to refresh per-attendee wait times */
  useEffect(() => {
    if (mode !== 'attendee' || !queueState.nowPlaying) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [mode, queueState.nowPlaying]);

  const removeSong = useCallback(
    (songId: string, reason: RemovalReason = 'played') => {
      setQueueState((current) => {
        const removed = current.songs.find((song) => song._id === songId);
        if (removed && (reason === 'rejected' || reason === 'skipped')) {
          const id = `${songId}-${reason}-${Date.now()}`;
          setFallingCards((cards) => [...cards, { id, song: removed, reason }]);
          window.setTimeout(() => {
            setFallingCards((cards) => cards.filter((card) => card.id !== id));
          }, 1300);
        }
        return {
          ...current,
          songs: current.songs.filter((song) => song._id !== songId),
          selectedSongId:
            current.selectedSongId === songId ? null : current.selectedSongId,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const eventData = readStoredJson<{ eventId?: string; eventCode?: string }>('currentEvent');

        if (!eventData) {
          setQueueState((current) => ({
            ...current,
            loading: false,
          }));
          return;
        }

        let resolvedEventId = propEventId || eventData.eventId || null;
        const eventCode = eventData.eventCode;

        if (!resolvedEventId) {
          if (!eventCode) {
            setQueueState((current) => ({
              ...current,
              loading: false,
            }));
            return;
          }

          const event = await eventsAPI.getEventByAccessCode(eventCode);
          if (!event) {
            setQueueState((current) => ({
              ...current,
              loading: false,
            }));
            return;
          }
          resolvedEventId = event._id;
        }

        if (!resolvedEventId) {
          setQueueState((current) => ({
            ...current,
            loading: false,
          }));
          return;
        }

        const queue = await songsAPI.getQueue(resolvedEventId);
        const nextSongs: Song[] = queue || [];
        const playing = nextSongs.find((song) => song.status === 'PLAYING');

        setQueueState((current) => ({
          ...current,
          songs: nextSongs,
          loading: false,
          resolvedEventId,
          nowPlaying: playing
            ? {
                songId: playing._id,
                duration: getSongDuration(playing) || 0,
                totalDuration: getSongDuration(playing),
                startedAt: playing.playingStartedAt
                  ? new Date(playing.playingStartedAt).getTime()
                  : Date.now(),
              }
            : current.nowPlaying,
        }));
      } catch (error) {
        console.error('Error fetching queue:', error);
        toast.error('Failed to load queue');
        setQueueState((current) => ({
          ...current,
          loading: false,
        }));
      }
    };

    fetchQueue();
  }, [propEventId, propParticipantId]);

  useEffect(() => {
    const upsertSong = (data: any, status: string) => {
      if (!data?.songId) return;
      setQueueState((current) => {
        const incoming: Song = {
          _id: data.songId,
          title: data.title || 'Untitled song',
          artist: data.artist || 'Unknown artist',
          voteScore: data.voteScore || 0,
          status: data.status || status,
          duration: data.totalDuration ?? data.duration,
          totalDuration: data.totalDuration ?? data.duration,
          queuePosition: data.queuePosition,
          requestedBy: data.requestedBy || null,
          eventId: data.eventId || current.resolvedEventId || undefined,
        };
        const exists = current.songs.some((song) => song._id === data.songId);

        return {
          ...current,
          songs: exists
            ? current.songs.map((song) =>
                song._id === data.songId ? { ...song, ...incoming } : song,
              )
            : [...current.songs, incoming],
        };
      });
    };

    const handleSuggested = (data: any) => {
      upsertSong(data, 'PENDING');
    };

    const handleQueued = (data: any) => {
      /* Song was approved into the queue. Add or update. */
      upsertSong(data, 'APPROVED');
    };
    const handleNowPlaying = (data: any) => {
      if (!data?.songId) return;
      removeSong(data.songId);
      setQueueState((current) => ({
        ...current,
        nowPlaying: {
          songId: data.songId,
          duration: data.totalDuration ?? data.duration ?? 0,
          totalDuration: data.totalDuration ?? data.duration,
          startedAt: data.playingStartedAt
            ? new Date(data.playingStartedAt).getTime()
            : Date.now(),
        },
      }));
    };
    const handleRejected = (data: any) => {
      if (data?.songId) removeSong(data.songId, 'rejected');
    };
    const handleSkipped = (data: any) => {
      if (data?.songId) removeSong(data.songId, 'skipped');
    };
    const handleVotesUpdated = (data: any) => {
      setQueueState((current) => {
        let nextSongs = current.songs;

        if (data?.songId && data?.voteScore != null) {
          nextSongs = nextSongs.map((song) =>
            song._id === data.songId ? { ...song, voteScore: data.voteScore } : song,
          );
        }

        if (Array.isArray(data?.affectedSongs)) {
          nextSongs = nextSongs.map((song) => {
            const update = data.affectedSongs.find(
              (affectedSong: any) => affectedSong.songId === song._id,
            );

            return update
              ? { ...song, queuePosition: update.queuePosition }
              : song;
          });
        }

        return nextSongs === current.songs
          ? current
          : {
              ...current,
              songs: nextSongs,
            };
      });
    };
    const handleQueueUpdated = (data: any) => {
      setQueueState((current) => ({
        ...current,
        songs: Array.isArray(data?.queue)
          ? [
              ...data.queue,
              ...current.songs.filter(
                (song) =>
                  song.status === 'PENDING' &&
                  !data.queue.some((queued: Song) => queued._id === song._id),
              ),
            ]
          : current.songs,
        nowPlaying: getNowPlayingSnapshot(data?.nowPlaying) ?? current.nowPlaying,
      }));
    };

    try {
      socket.onSongQueued(handleQueued);
      socket.onSongSuggested(handleSuggested);
      socket.onSongNowPlaying(handleNowPlaying);
      socket.onSongRejected(handleRejected);
      socket.onSongSkipped(handleSkipped);
      socket.onVotesUpdated(handleVotesUpdated);
      socket.onQueueUpdated(handleQueueUpdated);
    } catch {
      /* Socket not initialized yet — listeners will be missed, but no crash */
    }

    const stopDebugEvents = listenDebugSongEvents(({ type, payload }) => {
      if (type === 'song_suggested') handleSuggested(payload);
      if (type === 'song_approved') handleQueued(payload);
      if (type === 'song_now_playing') handleNowPlaying(payload);
      if (type === 'song_rejected') handleRejected(payload);
      if (type === 'song_skipped') handleSkipped(payload);
      if (type === 'queue_updated') handleQueueUpdated(payload);
      if (type === 'votes_updated') handleVotesUpdated(payload);
    });

    return () => {
      socket.off('song_suggested', handleSuggested);
      socket.off('song_approved', handleQueued);
      socket.off('song_now_playing', handleNowPlaying);
      socket.off('song_rejected', handleRejected);
      socket.off('song_skipped', handleSkipped);
      socket.off('votes_updated', handleVotesUpdated);
      socket.off('queue_updated', handleQueueUpdated);
      stopDebugEvents();
    };
  }, [removeSong]);

  /* Sort: PLAYING first, then QUEUED by voteScore desc (defensive — backend should sort too) */
  const sortedSongs = useMemo(() => {
    const order: Record<string, number> = {
      PLAYING: 0,
      APPROVED: 1,
      QUEUED: 1,
      PENDING: 2,
    };
    return queueState.songs.toSorted((a, b) => {
      const ao = order[a.status as string] ?? 99;
      const bo = order[b.status as string] ?? 99;
      if (ao !== bo) return ao - bo;
      return (b.voteScore || 0) - (a.voteScore || 0);
    });
  }, [queueState.songs]);

  /* Compute cumulative wait time for each queued song (for attendees) */
  const waitTimes = useMemo(() => {
    if (mode !== 'attendee') return new Map<string, number>();
    const map = new Map<string, number>();
    let cumulative = 0;
    if (queueState.nowPlaying) {
      const elapsed = Math.max(
        0,
        (Date.now() - queueState.nowPlaying.startedAt) / 1000,
      );
      const duration =
        queueState.nowPlaying.totalDuration ?? queueState.nowPlaying.duration;
      cumulative = duration == null ? 0 : Math.max(0, duration - elapsed);
    }
    void tick; // dependency for live update
    for (const s of sortedSongs) {
      if (s.status === 'PLAYING') continue;
      map.set(s._id, cumulative);
      cumulative += getSongDuration(s) || 0;
    }
    return map;
  }, [sortedSongs, queueState.nowPlaying, mode, tick]);

  return (
    <LazyMotion features={domAnimation}>
      <TooltipProvider>
      <m.div
        {...SLIDE_UP}
        transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
        layout
        className={clsx(
          'relative flex min-h-[190px] flex-1 flex-col overflow-hidden rounded-[14px] border backdrop-blur-xl',
        )}
        style={{
          backgroundColor: isDarkMode
            ? 'rgba(8, 17, 34, 0.88)'
            : 'rgba(255, 255, 255, 0.86)',
          borderColor: isDarkMode
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(15, 23, 42, 0.07)',
          boxShadow: isDarkMode
            ? '0 18px 38px rgba(2, 8, 23, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
            : '0 12px 28px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92)',
          backgroundImage: isDarkMode
            ? 'radial-gradient(circle at 50% 54%, rgba(47, 124, 255, 0.10), transparent 28%), linear-gradient(135deg, #081122 0%, #0d1b35 100%)'
            : 'radial-gradient(circle at 52% 55%, rgba(47, 124, 255, 0.035), transparent 26%)',
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

        <header
          className={clsx(
            'flex items-start gap-3 px-6 pt-5 sm:px-6 sm:pt-6',
          )}
        >
          <QueueHeader isDarkMode={isDarkMode} />
        </header>

        <m.div
          layout
          transition={{ type: 'spring', stiffness: 380, damping: 42 }}
          className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-5 pt-4 sm:px-6 sm:pb-6"
        >
          <AnimatePresence mode="wait">
            {queueState.loading ? (
              <m.div
                key="loading"
                layout
                className={clsx(
                  'py-8 text-sm font-medium',
                  isDarkMode ? 'text-slate-400' : 'text-slate-500',
                )}
              >
                Loading queue…
              </m.div>
            ) : sortedSongs.length > 0 ? (
              <m.div
                key="queue-list"
                layout
                className="flex flex-col gap-3"
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
                        context={{
                          first: i === 0,
                          mode,
                          selected: queueState.selectedSongId === song._id,
                          mine: isMine,
                        }}
                        primaryColor={primaryColor}
                        onSelect={(id) =>
                          setQueueState((current) => ({
                            ...current,
                            selectedSongId:
                              current.selectedSongId === id ? null : id,
                          }))
                        }
                        onSongRemoved={removeSong}
                        eventId={queueState.resolvedEventId || undefined}
                        isDarkMode={isDarkMode}
                        waitSeconds={wait}
                        djUserId={djUserId}
                      />
                    );
                  })}
                </AnimatePresence>
              </m.div>
            ) : (
              <QueueEmptyState
                key="empty-state"
                isDarkMode={isDarkMode}
              />
            )}
          </AnimatePresence>
        </m.div>
      </m.div>
      </TooltipProvider>
    </LazyMotion>
  );
}

function QueueHeader({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <>
      <svg
        className={clsx(
          'mt-0.5 h-[18px] w-[18px] flex-shrink-0',
          isDarkMode ? 'text-slate-400' : 'text-slate-500',
        )}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M9 7h10M9 12h10M9 17h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M4.5 7h.01M4.5 12h.01M4.5 17h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div>
        <h3
          className={clsx(
            'text-[13px] font-extrabold leading-tight tracking-[-0.02em]',
            isDarkMode ? 'text-slate-50' : 'text-slate-900',
          )}
        >
          Up Next
        </h3>
        <p
          className={clsx(
            'mt-1 text-[11px] font-semibold leading-tight',
            isDarkMode ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          Songs in the queue
        </p>
      </div>
    </>
  );
}

function QueueEmptyState({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <m.div
      layout
      className="flex flex-1 items-center justify-center py-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: ANIMATION_DURATION.normal }}
    >
      <div className="relative w-[260px] max-w-full text-center sm:w-[220px]">
        <div
          className={clsx(
            'relative mx-auto mb-[9px] grid h-[58px] w-[58px] place-items-center rounded-full',
            isDarkMode ? 'bg-sky-500/12' : 'bg-sky-100',
          )}
        >
          <span
            className="absolute left-[-24px] top-[27px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#ff4f9a' }}
            aria-hidden="true"
          />
          <span
            className="absolute left-[-10px] top-[43px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#2f7cff' }}
            aria-hidden="true"
          />
          <span
            className="absolute right-[-18px] top-[21px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#32d583' }}
            aria-hidden="true"
          />
          <span
            className="absolute right-[-11px] top-[42px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#f8c84e' }}
            aria-hidden="true"
          />

          <svg
            className={clsx(
              'h-[25px] w-[25px]',
              isDarkMode ? 'text-sky-400' : 'text-blue-600',
            )}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 17.2a3.2 3.2 0 1 1-1.9-2.9V7.2c0-.8.5-1.4 1.3-1.6l7.4-1.5c.6-.1 1.2.3 1.2.9v2.1l-7.2 1.5v8.6H10Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h3
          className={clsx(
            'text-[13px] font-extrabold leading-tight tracking-[-0.02em]',
            isDarkMode ? 'text-slate-50' : 'text-slate-900',
          )}
        >
          The queue is empty
        </h3>
        <p
          className={clsx(
            'mt-1 text-[12px] font-semibold leading-tight',
            isDarkMode ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          Be the first to request a song!
        </p>
      </div>
    </m.div>
  );
}

interface QueueItemContext {
  first: boolean;
  mode: 'attendee' | 'dj';
  selected: boolean;
  mine: boolean;
}

interface QueueItemProps {
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
}

function QueueItem({
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
}: QueueItemProps) {
  const isDj = context.mode === 'dj';
  const canModerateRequester = !!song.requestedBy?._id && !isRequestedByDj(song, djUserId);

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
        toast.success(`Queued "${song.title}"`);
      } else if (action === 'Send Now' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.sendNow(eventId, songId);
        onSongRemoved(songId);
        toast.success(`Now playing "${song.title}"`);
      } else if (action === 'Reject' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
        onSongRemoved(songId, 'rejected');
        toast.success(`Rejected "${song.title}"`);
      } else if (action === 'Cooldown' && eventId) {
        if (!canModerateRequester || !song.requestedBy?._id) {
          toast.error('Only attendee requests can be moderated');
          return;
        }
        await participantsAPI.setCooldown(
          song.requestedBy._id,
          300000,
          'DJ applied cooldown',
        );
        toast.success('User on cooldown');
      } else if (action === 'Kick' && eventId) {
        if (!canModerateRequester || !song.requestedBy?._id) {
          toast.error('Only attendee requests can be moderated');
          return;
        }
        await participantsAPI.kickParticipant(
          song.requestedBy._id,
          'Kicked by DJ',
        );
        toast.success('User kicked from event');
      } else if (action === 'Skip' && eventId) {
        if (!songId) {
          toast.error('Song ID not found');
          return;
        }
        await songsAPI.skipSong(eventId, songId, 'Skipped by DJ');
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
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
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
                </m.button>
              </TooltipTrigger>
              <TooltipContent>Approve (Add to Queue)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <m.button
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
                </m.button>
              </TooltipTrigger>
              <TooltipContent>Send Song Now</TooltipContent>
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
              <TooltipContent>Reject Song</TooltipContent>
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
              <TooltipContent>Cooldown User</TooltipContent>
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
              <TooltipContent>Skip Song</TooltipContent>
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
              <TooltipContent>Kick User</TooltipContent>
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
    <m.div
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
    </m.div>
  );
}
