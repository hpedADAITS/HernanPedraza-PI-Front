import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { eventsAPI, songsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { normalizeNowPlaying, normalizeQueueUpdated, normalizeSocketSong } from '@/services/socket/normalize';
import { getStoredEvent, getStoredParticipantId } from '@/services/session';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import { t } from '@/i18n';
import type { Song } from '@/types/songs';
import type { NowPlayingEventPayload, QueueUpdatedPayload, SongEventPayload, VotesUpdatedPayload } from '@/services/socket/contracts';

export type RemovalReason = 'rejected' | 'skipped' | 'played';

type QueueCard = {
  id: string;
  song: Song;
  reason: RemovalReason;
};

type NowPlayingState = {
  songId: string;
  totalDuration?: number;
  startedAt: number;
} | null;

type QueueState = {
  songs: Song[];
  loading: boolean;
  selectedSongId: string | null;
  resolvedEventId: string | null;
  nowPlaying: NowPlayingState;
};

function getSongId(payload: SongEventPayload) {
  return payload.songId ?? payload._id ?? payload.id ?? null;
}

function getSongDuration(song?: Partial<Song> | null) {
  const duration = song?.totalDuration;
  return Number.isFinite(duration) && duration != null ? duration : undefined;
}

function getNowPlayingState(payload?: NowPlayingEventPayload | null): NowPlayingState {
  const normalized = normalizeNowPlaying(payload);
  if (!normalized) return null;

  return {
    songId: normalized.songId,
    totalDuration: normalized.totalDuration,
    startedAt: normalized.startedAt,
  };
}

function getInitialState(initialEventId?: string): QueueState {
  const eventData = getStoredEvent();

  return {
    songs: [],
    loading: true,
    selectedSongId: null,
    resolvedEventId: initialEventId ?? eventData?.eventId ?? null,
    nowPlaying: null,
  };
}

function getSortedSongs(songs: Song[]) {
  const order: Record<string, number> = {
    PLAYING: 0,
    APPROVED: 1,
    QUEUED: 1,
    PENDING: 2,
  };

  return songs.toSorted((a, b) => {
    const ao = order[a.status as string] ?? 99;
    const bo = order[b.status as string] ?? 99;
    if (ao !== bo) return ao - bo;
    return (b.voteScore || 0) - (a.voteScore || 0);
  });
}

export function useQueueRealtime(mode: 'attendee' | 'dj', eventId?: string) {
  const toast = useToast();
  const [state, setState] = useState<QueueState>(() => getInitialState(eventId));
  const [fallingCards, setFallingCards] = useState<QueueCard[]>([]);
  const [tick, setTick] = useState(0);
  const songsRef = useRef<Song[]>([]);

  useEffect(() => {
    songsRef.current = state.songs;
  }, [state.songs]);

  const removeSong = useCallback((songId: string, reason: RemovalReason = 'played') => {
    setState((current) => {
      const removed = current.songs.find((song) => song._id === songId);
      const nowPlayingRemoved = current.nowPlaying?.songId === songId;
      if (removed && (reason === 'rejected' || reason === 'skipped')) {
        const id = `${songId}-${reason}-${Date.now()}`;
        setFallingCards((cards) => [...cards, { id, song: removed, reason }]);
        window.setTimeout(() => {
          setFallingCards((cards) => cards.filter((card) => card.id !== id));
        }, 1300);
      }

      return {
        ...current,
        nowPlaying: nowPlayingRemoved ? null : current.nowPlaying,
        songs: current.songs.filter((song) => song._id !== songId),
        selectedSongId: current.selectedSongId === songId ? null : current.selectedSongId,
      };
    });
  }, []);

  const selectSong = useCallback((songId: string) => {
    setState((current) => ({
      ...current,
      selectedSongId: current.selectedSongId === songId ? null : songId,
    }));
  }, []);

  useEffect(() => {
    if (mode !== 'attendee' || !state.nowPlaying) return undefined;
    const id = window.setInterval(() => setTick((current) => current + 1), 1000);
    return () => window.clearInterval(id);
  }, [mode, state.nowPlaying]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const eventData = getStoredEvent();
        if (!eventData) {
          setState((current) => ({ ...current, loading: false }));
          return;
        }

        let resolvedEventId = eventId || eventData.eventId || null;
        const eventCode = eventData.eventCode;

        if (!resolvedEventId) {
          if (!eventCode) {
            setState((current) => ({ ...current, loading: false }));
            return;
          }

          const event = await eventsAPI.getEventByAccessCode(eventCode);
          if (!event) {
            setState((current) => ({ ...current, loading: false }));
            return;
          }
          resolvedEventId = event._id;
        }

        if (!resolvedEventId) {
          setState((current) => ({ ...current, loading: false }));
          return;
        }

        const queue = await songsAPI.getQueue(resolvedEventId);
        const songs: Song[] = queue || [];
        const playing = songs.find((song) => song.status === 'PLAYING');

        setState((current) => ({
          ...current,
          songs,
          loading: false,
          resolvedEventId,
          nowPlaying: playing
            ? {
                songId: playing._id,
                totalDuration: getSongDuration(playing),
                startedAt: playing.startedAt ? new Date(playing.startedAt).getTime() : Date.now(),
              }
            : current.nowPlaying,
        }));
      } catch (error) {
        console.error('Error fetching queue:', error);
        toast.error(t('Failed to load queue'));
        setState((current) => ({ ...current, loading: false }));
      }
    };

    fetchQueue();
  }, [eventId]);

  useEffect(() => {
    const upsertSong = (data: SongEventPayload, status: string) => {
      setState((current) => {
        const incoming = normalizeSocketSong(data, status, current.resolvedEventId);
        if (!incoming) return current;

        const exists = current.songs.some((song) => song._id === incoming._id);
        return {
          ...current,
          songs: exists
            ? current.songs.map((song) => (song._id === incoming._id ? { ...song, ...incoming } : song))
            : [...current.songs, incoming],
        };
      });
    };

    const handleSuggested = (data: SongEventPayload) => {
      upsertSong(data, 'PENDING');
    };

    const handleQueued = (data: SongEventPayload) => {
      upsertSong(data, 'APPROVED');
    };

    const handleNowPlaying = (data: NowPlayingEventPayload) => {
      const songId = getSongId(data);
      if (!songId) return;
      removeSong(songId);
      const nowPlaying = getNowPlayingState(data);
      if (!nowPlaying) return;
      setState((current) => ({ ...current, nowPlaying }));
    };

    const handleRejected = (data: SongEventPayload) => {
      const songId = getSongId(data);
      if (songId) removeSong(songId, 'rejected');
    };

    const handleSkipped = (data: SongEventPayload) => {
      const songId = getSongId(data);
      if (songId) removeSong(songId, 'skipped');
    };

    const handleVotesUpdated = (data: VotesUpdatedPayload) => {
      const direction = data.value === 1 ? 'up' : data.value === -1 ? 'down' : undefined;
      const song = data.songId ? songsRef.current.find((item) => item._id === data.songId) : null;
      if (direction && song?.requestedBy?._id === getStoredParticipantId()) {
        toast.success(direction === 'up' ? t('Track boosted') : t('Track lowered'));
      }

      setState((current) => {
        let nextSongs = current.songs;

        if (data?.songId && data?.voteScore != null) {
          nextSongs = nextSongs.map((song) =>
            song._id === data.songId
              ? {
                  ...song,
                  voteScore: data.voteScore ?? song.voteScore,
                  voteCount: data.voteCount ?? song.voteCount,
                  voteFlash: direction,
                }
              : song,
          );
        }

        const affectedSongs = data?.affectedSongs;
        if (Array.isArray(affectedSongs)) {
          nextSongs = nextSongs.map((song) => {
            const update = affectedSongs.find(
              (affectedSong) => (affectedSong.songId ?? affectedSong._id ?? affectedSong.id) === song._id,
            );

            return update ? { ...song, queuePosition: update.queuePosition } : song;
          });
        }

        return nextSongs === current.songs ? current : { ...current, songs: nextSongs };
      });
    };

    const handleQueueUpdated = (data: QueueUpdatedPayload) => {
      const normalized = normalizeQueueUpdated(data);
      setState((current) => ({
        ...current,
        songs: normalized.queue
          ? [
              ...normalized.queue,
              ...current.songs.filter(
                (song) =>
                  song.status === 'PENDING' && !normalized.queue!.some((queued) => queued._id === song._id),
              ),
            ]
          : current.songs,
        nowPlaying: normalized.nowPlaying
          ? {
              songId: normalized.nowPlaying.songId,
              totalDuration: normalized.nowPlaying.totalDuration,
              startedAt: normalized.nowPlaying.startedAt,
            }
          : current.nowPlaying,
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
      /* Socket not initialized yet */
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

  const sortedSongs = useMemo(() => getSortedSongs(state.songs), [state.songs]);

  const waitTimes = useMemo(() => {
    if (mode !== 'attendee') return new Map<string, number>();

    const map = new Map<string, number>();
    let cumulative = 0;

    if (state.nowPlaying) {
      const elapsed = Math.max(0, (Date.now() - state.nowPlaying.startedAt) / 1000);
      const duration = state.nowPlaying.totalDuration;
      cumulative = duration == null ? 0 : Math.max(0, duration - elapsed);
    }

    void tick;
    for (const song of sortedSongs) {
      if (song.status === 'PLAYING') continue;
      map.set(song._id, cumulative);
      cumulative += getSongDuration(song) || 0;
    }

    return map;
  }, [mode, sortedSongs, state.nowPlaying, tick]);

  return {
    fallingCards,
    loading: state.loading,
    removeSong,
    resolvedEventId: state.resolvedEventId,
    selectSong,
    selectedSongId: state.selectedSongId,
    sortedSongs,
    waitTimes,
  } as const;
}
