import React, { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { m } from 'motion/react';
import { NowPlaying } from '@/components/common';
import { NOW_PLAYING } from '@/constants/dashboard';
import { SCALE_IN } from '@/constants/animations';
import { initSocket, onSongQueued, onSongNowPlaying, onSongRejected, onSongSkipped, onQueueUpdated, onSongSuggested, onPhoneMicrophoneConnected, onAudioMatchChunk, onAudioMatchUpdate, onPhoneAudioStream, off } from '@/services/socket';
import { normalizeNowPlaying, normalizeQueueUpdated, normalizeSocketSong } from '@/services/socket/normalize';
import { songsAPI } from '@/services/api';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import { getStoredEventId } from '@/services/session';
import { useTrackedTimeout } from '@/hooks/useTrackedTimeout';
import type { Song } from '@/types/songs';
import type { NowPlayingEventPayload, QueueUpdatedPayload, SongEventPayload, PhoneMicrophoneConnectedPayload, AudioMatchChunkPayload, AudioMatchUpdatePayload, PhoneAudioStreamPayload } from '@/services/socket/contracts';

interface NowPlayingSong {
  id: string;
  title: string;
  artist: string;
  status: 'playing' | 'rejected' | 'queued' | 'skipped' | 'matched' | 'idle';
  progress?: number;
  currentTime?: string;
  duration?: string;
  durationSec?: number;
  startedAt?: number;
  albumArt?: string | null;
}

interface CurrentMatch {
  trackId: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  duration?: number | null;
  score: number;
  matchedAt: number;
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

function matchToPlayerSong(match: CurrentMatch): NowPlayingSong {
  const duration = Number.isFinite(match.duration) ? (match.duration as number) : undefined;
  return {
    id: `match-${match.trackId}`,
    title: match.title || 'Matched track',
    artist: match.artist || 'Unknown artist',
    status: 'matched',
    progress: 0,
    currentTime: '0:00',
    duration: duration ? formatTime(duration) : undefined,
    durationSec: duration,
    albumArt: match.coverUrl || null,
  };
}

function getSongDuration(song?: Partial<Song> | null): number | undefined {
  const duration = song?.totalDuration;
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
    albumArt: song.recognitionMatch?.coverUrl || null,
    startedAt: song.startedAt
      ? new Date(song.startedAt).getTime()
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
  currentMatch: CurrentMatch | null;
  attentionKey: number;
  celebrateKey: number;
  microphone: string | null;
  audioLevel: number;
  pcmData: Float32Array | null;
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
  | { type: 'clear_temp_status' }
  | { type: 'microphone_connected'; deviceName: string }
  | { type: 'audio_level'; level: number }
  | { type: 'audio_pcm'; pcm: Float32Array }
  | { type: 'audio_match_update'; payload: AudioMatchUpdatePayload };

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
          duration: nowPlaying.totalDuration
            ? formatTime(nowPlaying.totalDuration)
            : undefined,
          durationSec: nowPlaying.totalDuration,
          startedAt: nowPlaying.startedAt,
          albumArt: nowPlaying.albumArt,
        },
        currentMatch: null,
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
              progress: data.nowPlaying.totalDuration
                ? Math.min(
                    100,
                    ((data.nowPlaying.elapsedTime || 0) / data.nowPlaying.totalDuration) * 100,
                  )
                : 0,
              currentTime: formatTime(data.nowPlaying.elapsedTime || 0),
              duration: data.nowPlaying.totalDuration
                ? formatTime(data.nowPlaying.totalDuration)
                : undefined,
              durationSec: data.nowPlaying.totalDuration,
              startedAt: data.nowPlaying.startedAt,
              albumArt: data.nowPlaying.albumArt,
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
    case 'microphone_connected':
      return {
        ...state,
        microphone: action.deviceName,
      };
    case 'audio_level':
      return {
        ...state,
        audioLevel: action.level,
      };
    case 'audio_pcm':
      return {
        ...state,
        pcmData: action.pcm,
      };
    case 'audio_match_update': {
      const topMatch = action.payload?.matches?.[0];
      if (!topMatch?.trackId) {
        // Nothing to show. Only produce a new state (and a re-render) if a
        // match was actually being displayed; otherwise keep the same
        // reference so repeated empty updates don't churn the component.
        if (!state.currentMatch) return state;
        return {
          ...state,
          currentMatch: null,
        };
      }

      // Same candidate as before: the matcher re-confirming its hold should
      // not re-render NowPlaying. Return the identical state reference so
      // React bails out of the update.
      if (state.currentMatch?.trackId === topMatch.trackId) {
        return state;
      }

      const nextMatch: CurrentMatch = {
        trackId: topMatch.trackId,
        title: topMatch.title,
        artist: topMatch.artist,
        coverUrl: topMatch.coverUrl ?? null,
        duration: topMatch.duration ?? null,
        score: topMatch.score,
        matchedAt: Date.now(),
      };

      return {
        ...state,
        currentMatch: nextMatch,
        attentionKey: state.attentionKey + 1,
      };
    }
    default:
      return state;
  }
}

export function NowPlayingSection() {
  const [state, dispatch] = useReducer(nowPlayingSectionReducer, {
    queue: [],
    nowPlaying: null,
    tempStatus: null,
    currentMatch: null,
    attentionKey: 0,
    celebrateKey: 0,
    microphone: null,
    audioLevel: 0,
    pcmData: null,
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempStatusTimeoutRef = useRef<number | null>(null);
  const { clearTrackedTimeout, setTrackedTimeout } = useTrackedTimeout();
  const eventId = getStoredEventId();

  const showTemporaryStatus = useCallback(
    (
      payload: SongEventPayload,
      status: 'rejected' | 'skipped',
      fallbackArtist: string,
    ) => {
      if (tempStatusTimeoutRef.current) {
        clearTrackedTimeout(tempStatusTimeoutRef.current);
      }
      dispatch({
        type: 'song_status',
        payload,
        status,
        fallbackArtist,
      });
      tempStatusTimeoutRef.current = setTrackedTimeout(() => {
        dispatch({ type: 'clear_temp_status' });
        tempStatusTimeoutRef.current = null;
      }, 2000);
    },
    [clearTrackedTimeout, setTrackedTimeout],
  );

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
        tickRef.current = null;
        setElapsedSeconds(0);
      };
    }
    // Reset when not playing
    setElapsedSeconds(0);
    return undefined;
  }, [state.nowPlaying?.id, state.nowPlaying?.status, state.nowPlaying?.startedAt]);

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

    const handlePhoneMicrophoneConnected = (data: PhoneMicrophoneConnectedPayload) => {
      dispatch({ type: 'microphone_connected', deviceName: data.deviceName || 'Phone microphone' });
    };

    const handleAudioMatchChunk = (data: AudioMatchChunkPayload) => {
      if (!data.pcm || data.pcm.length === 0) return;
      dispatch({ type: 'audio_pcm', pcm: data.pcm });
    };

    const handlePhoneAudioStream = (data: PhoneAudioStreamPayload) => {
      if (!data.pcm || data.pcm.length === 0) return;
      dispatch({ type: 'audio_pcm', pcm: new Float32Array(data.pcm) });
    };

    const handleAudioMatchUpdate = (data: AudioMatchUpdatePayload) => {
      dispatch({ type: 'audio_match_update', payload: data });
    };

    onSongQueued(handleSongQueued);
    onSongSuggested(handleSongSuggested);
    onSongNowPlaying(handleSongNowPlaying);
    onSongRejected(handleSongRejected);
    onSongSkipped(handleSongSkipped);
    onQueueUpdated(handleQueueUpdated);
    onPhoneMicrophoneConnected(handlePhoneMicrophoneConnected);
    onAudioMatchChunk(handleAudioMatchChunk);
    onAudioMatchUpdate(handleAudioMatchUpdate);
    onPhoneAudioStream(handlePhoneAudioStream);

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
      off('phone_microphone_connected', handlePhoneMicrophoneConnected);
      off('audio_match_chunk', handleAudioMatchChunk);
      off('audio_match_update', handleAudioMatchUpdate);
      off('phone_audio_stream', handlePhoneAudioStream);
      stopDebugEvents();
    };
  }, [eventId, showTemporaryStatus]);

  /* Compute live elapsed/progress when playing */
  const queuedPreview = sortQueueSongs(state.queue).find(
    (song) => song.status !== 'PLAYING',
  );

  const matchedPreview = state.currentMatch
    ? matchToPlayerSong(state.currentMatch)
    : null;

  let display: NowPlayingSong | typeof NOW_PLAYING =
    state.tempStatus ||
    state.nowPlaying ||
    matchedPreview ||
    (queuedPreview ? toPlayerSong(queuedPreview) : NOW_PLAYING);
  const albumArt = 'albumArt' in display ? display.albumArt : undefined;

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
    <m.div
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex w-full items-center justify-center"
    >
      <m.div
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
          albumArt={albumArt || undefined}
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
          microphoneLabel={state.microphone || undefined}
          audioLevel={state.microphone ? state.audioLevel : undefined}
          pcmData={state.microphone && state.pcmData ? state.pcmData : undefined}
        />
      </m.div>
    </m.div>
  );
}
