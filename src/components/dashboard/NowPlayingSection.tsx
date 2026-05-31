import React, { useEffect, useReducer, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { NowPlaying } from '@/components/common';
import { NOW_PLAYING } from '@/constants/dashboard';
import { SCALE_IN } from '@/constants/animations';
import { initSocket, onSongQueued, onSongNowPlaying, onSongRejected, onSongSkipped, onQueueUpdated, onSongSuggested, off,  } from '@/services/socket';
import {
  normalizeNowPlaying,
  normalizeQueueUpdated,
  normalizeSocketSong,
} from '@/services/socket/normalize';
import { songsAPI } from '@/services/api';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import { getStoredEventId } from '@/services/session';
import type { Song } from '@/types/songs';
import type {
  NowPlayingEventPayload,
  QueueUpdatedPayload,
  SongEventPayload,
} from '@/services/socket/contracts';

interface NowPlayingSong {
  id: string;
  title: string;
  artist: string;
  status: 'playing' | 'rejected' | 'queued' | 'skipped' | 'idle';
  progress?: number;
  currentTime?: string;
  duration?: string;
  durationSec?: number;
  startedAt?: number;
}

function formatWait(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getSongDuration(song?: Partial<Song> | null): number | undefined {
  const duration = song?.totalDuration ?? song?.duration;
  return Number.isFinite(duration) && duration != null ? duration : undefined;
}

function getPayloadSongId(payload: SongEventPayload) {
  return payload.songId ?? payload._id ?? payload.id ?? null;
}

function toPlayerSong(song: Song): NowPlayingSong {
  const duration = getSongDuration(song);
  return {
    id: song._id,
    title: song.title || 'Queued Song',
    artist: song.artist || 'Unknown Artist',
    status: song.status === 'PLAYING' ? 'playing' : 'queued',
    progress: 0,
    currentTime: '0:00',
    duration: duration ? formatTime(duration) : undefined,
    durationSec: duration,
    startedAt: song.playingStartedAt
      ? new Date(song.playingStartedAt).getTime()
      : undefined,
  };
}

function sortQueueSongs(songs: Song[]): Song[] {
  const order: Record<string, number> = {
    PLAYING: 0,
    APPROVED: 1,
    QUEUED: 1,
    PENDING: 2,
  };

  return songs.slice().sort((a, b) => {
    const ao = order[a.status as string] ?? 99;
    const bo = order[b.status as string] ?? 99;
    if (ao !== bo) return ao - bo;
    if (a.queuePosition != null && b.queuePosition != null) {
      return a.queuePosition - b.queuePosition;
    }
    return (b.voteScore || 0) - (a.voteScore || 0);
  });
}

interface NowPlayingSectionState {
  queue: Song[];
  nowPlaying: NowPlayingSong | null;
  tempStatus: NowPlayingSong | null;
  attentionKey: number;
  celebrateKey: number;
}

type NowPlayingSectionAction =
  | { type: 'initialize'; queue: Song[]; nowPlaying: NowPlayingSong | null }
  | { type: 'song_queued'; song: Song }
  | { type: 'song_now_playing'; payload: NowPlayingEventPayload }
  | {
      type: 'song_status';
      payload: SongEventPayload;
      status: 'rejected' | 'skipped';
      fallbackArtist: string;
    }
  | { type: 'queue_updated'; payload: QueueUpdatedPayload }
  | { type: 'clear_temp_status' };

function nowPlayingSectionReducer(
  state: NowPlayingSectionState,
  action: NowPlayingSectionAction,
): NowPlayingSectionState {
  switch (action.type) {
    case 'initialize':
      return {
        ...state,
        queue: action.queue,
        nowPlaying: action.nowPlaying,
      };
    case 'song_queued': {
      return {
        ...state,
        queue: sortQueueSongs([
          ...state.queue.filter((song) => song._id !== action.song._id),
          action.song,
        ]),
        attentionKey: state.attentionKey + 1,
      };
    }
    case 'song_now_playing': {
      const nowPlaying = normalizeNowPlaying(action.payload);
      if (!nowPlaying) return state;

      return {
        ...state,
        nowPlaying: {
          id: nowPlaying.songId,
          title: nowPlaying.title,
          artist: nowPlaying.artist,
          status: 'playing',
          progress: 0,
          currentTime: '0:00',
          duration: nowPlaying.duration
            ? formatTime(nowPlaying.duration)
            : undefined,
          durationSec: nowPlaying.totalDuration,
          startedAt: nowPlaying.startedAt,
        },
        queue: state.queue.filter((song) => song._id !== nowPlaying.songId),
        celebrateKey: state.celebrateKey + 1,
      };
    }
    case 'song_status': {
      const data = action.payload;
      const songId = getPayloadSongId(data);
      const title =
        action.status === 'rejected' ? 'Song Rejected' : 'Song Skipped';

      return {
        ...state,
        tempStatus: {
          id: songId ?? `${action.status}-song`,
          title,
          artist: data.reason || action.fallbackArtist,
          status: action.status,
        },
        queue: songId
          ? state.queue.filter((song) => song._id !== songId)
          : state.queue,
        nowPlaying:
          songId && state.nowPlaying?.id === songId
            ? null
            : state.nowPlaying,
      };
    }
    case 'queue_updated': {
      const data = normalizeQueueUpdated(action.payload);
      const nextQueue = data.queue
        ? sortQueueSongs(data.queue)
        : state.queue;
      const nowPlaying =
        data.nowPlaying
          ? {
              id: data.nowPlaying.songId,
              title: data.nowPlaying.title,
              artist: data.nowPlaying.artist,
              status: 'playing' as const,
              progress: data.nowPlaying.duration
                ? Math.min(
                    100,
                    ((data.nowPlaying.elapsedTime || 0) / data.nowPlaying.duration) * 100,
                  )
                : 0,
              currentTime: formatTime(data.nowPlaying.elapsedTime || 0),
              duration: data.nowPlaying.duration
                ? formatTime(data.nowPlaying.duration)
                : undefined,
              durationSec: data.nowPlaying.totalDuration,
              startedAt: data.nowPlaying.startedAt,
            }
          : state.nowPlaying;

      return {
        ...state,
        queue: nextQueue,
        nowPlaying,
        attentionKey:
          Array.isArray(data.queue) &&
          data.queue.some((song: Song) => song.status !== 'PLAYING')
            ? state.attentionKey + 1
            : state.attentionKey,
      };
    }
    case 'clear_temp_status':
      return {
        ...state,
        tempStatus: null,
      };
    default:
      return state;
  }
}

export function NowPlayingSection() {
  const [state, dispatch] = useReducer(nowPlayingSectionReducer, {
    queue: [],
    nowPlaying: null,
    tempStatus: null,
    attentionKey: 0,
    celebrateKey: 0,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const eventId = getStoredEventId();

  const showTemporaryStatus = (
    payload: SongEventPayload,
    status: 'rejected' | 'skipped',
    fallbackArtist: string,
  ) => {
    if (tempStatusTimeoutRef.current) {
      clearTimeout(tempStatusTimeoutRef.current);
    }
    dispatch({
      type: 'song_status',
      payload,
      status,
      fallbackArtist,
    });
    tempStatusTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'clear_temp_status' });
    }, 2000);
  };

  /* Tick every second so progress/elapsed advance smoothly */
  useEffect(() => {
    const startedAt = state.nowPlaying?.startedAt;

    if (state.nowPlaying?.status === 'playing' && startedAt) {
      const updateElapsed = () => {
        setElapsedSeconds(
          Math.max(0, (Date.now() - startedAt) / 1000),
        );
      };
      updateElapsed();
      tickRef.current = setInterval(updateElapsed, 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
    setElapsedSeconds(0);
    return undefined;
  }, [state.nowPlaying?.id, state.nowPlaying?.status, state.nowPlaying?.startedAt]);

  useEffect(() => {
    return () => {
      if (tempStatusTimeoutRef.current) {
        clearTimeout(tempStatusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!eventId) return;

    const fetchQueue = async () => {
      try {
        const queueData = await songsAPI.getQueue(eventId);
        if (!queueData) return;

        const sortedQueue = sortQueueSongs(queueData);
        const playing = sortedQueue.find((song) => song.status === 'PLAYING');

        dispatch({
          type: 'initialize',
          queue: sortedQueue,
          nowPlaying: playing ? toPlayerSong(playing) : null,
        });
      } catch (error) {
        console.error('Error fetching queue:', error);
      }
    };

    fetchQueue();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    initSocket();

    const queueSong = (
      data: SongEventPayload,
      fallbackStatus: 'APPROVED' | 'PENDING',
    ) => {
      const song = normalizeSocketSong(data, fallbackStatus, eventId);
      if (song) dispatch({ type: 'song_queued', song });
    };

    const handleSongQueued = (data: SongEventPayload) => {
      queueSong(data, 'APPROVED');
    };

    const handleSongSuggested = (data: SongEventPayload) => {
      queueSong(data, 'PENDING');
    };

    const handleSongNowPlaying = (data: NowPlayingEventPayload) => {
      dispatch({ type: 'song_now_playing', payload: data });
    };

    const handleSongRejected = (data: SongEventPayload) => {
      showTemporaryStatus(data, 'rejected', 'No reason provided');
    };

    const handleSongSkipped = (data: SongEventPayload) => {
      showTemporaryStatus(data, 'skipped', 'DJ skipped');
    };

    const handleQueueUpdated = (data: QueueUpdatedPayload) => {
      dispatch({ type: 'queue_updated', payload: data });
    };

    onSongQueued(handleSongQueued);
    onSongSuggested(handleSongSuggested);
    onSongNowPlaying(handleSongNowPlaying);
    onSongRejected(handleSongRejected);
    onSongSkipped(handleSongSkipped);
    onQueueUpdated(handleQueueUpdated);

    const stopDebugEvents = listenDebugSongEvents(({ type, payload }) => {
      if (type === 'song_suggested') handleSongSuggested(payload);
      if (type === 'song_approved') handleSongQueued(payload);
      if (type === 'song_now_playing') handleSongNowPlaying(payload);
      if (type === 'song_rejected') handleSongRejected(payload);
      if (type === 'song_skipped') handleSongSkipped(payload);
      if (type === 'queue_updated') handleQueueUpdated(payload);
    });

    return () => {
      off('song_suggested', handleSongSuggested);
      off('song_approved', handleSongQueued);
      off('song_now_playing', handleSongNowPlaying);
      off('song_rejected', handleSongRejected);
      off('song_skipped', handleSongSkipped);
      off('queue_updated', handleQueueUpdated);
      stopDebugEvents();
    };
  }, [eventId]);

  /* Compute live elapsed/progress when playing */
  const queuedPreview = sortQueueSongs(state.queue).find(
    (song) => song.status !== 'PLAYING',
  );

  let display: NowPlayingSong | typeof NOW_PLAYING =
    state.tempStatus ||
    state.nowPlaying ||
    (queuedPreview ? toPlayerSong(queuedPreview) : NOW_PLAYING);

  if (
    !state.tempStatus &&
    state.nowPlaying &&
    state.nowPlaying.status === 'playing' &&
    state.nowPlaying.startedAt &&
    state.nowPlaying.durationSec
  ) {
    const elapsed = elapsedSeconds;
    const progress = Math.min(100, (elapsed / state.nowPlaying.durationSec) * 100);
    display = {
      ...state.nowPlaying,
      progress,
      currentTime: formatTime(elapsed),
    };
  }

  return (
    <motion.div
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex w-full items-center justify-center"
    >
      <motion.div
        className="w-full"
        key={`${display.id}-${display.status}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.22 }}
      >
        <NowPlaying
          songTitle={display.title}
          artist={display.artist}
          status={display.status}
          progress={display.progress}
          currentTime={display.currentTime}
          duration={display.duration}
          waitLabel={
            display.status === 'queued'
              ? (() => {
                  const sorted = sortQueueSongs(state.queue).filter(
                    (song) => song.status !== 'PLAYING',
                  );
                  const previewIndex = sorted.findIndex(
                    (song) => song._id === display.id,
                  );
                  let wait = 0;
                  if (
                    state.nowPlaying?.status === 'playing' &&
                    state.nowPlaying.startedAt &&
                    state.nowPlaying.durationSec
                  ) {
                    const elapsed = Math.max(
                      0,
                      elapsedSeconds,
                    );
                    wait = Math.max(0, state.nowPlaying.durationSec - elapsed);
                  }
                  for (const song of sorted.slice(0, Math.max(0, previewIndex))) {
                    wait += getSongDuration(song) || 0;
                  }
                  return wait <= 0
                    ? 'Up Next'
                    : `Starts in ~${formatWait(wait)}`;
                })()
              : undefined
          }
          attentionKey={state.attentionKey}
          celebrateKey={state.celebrateKey}
        />
      </motion.div>
    </motion.div>
  );
}
