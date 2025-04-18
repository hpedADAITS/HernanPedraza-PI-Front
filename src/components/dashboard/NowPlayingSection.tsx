import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { NowPlaying } from '@/components/common';
import { NOW_PLAYING } from '@/constants/dashboard';
import { SCALE_IN } from '@/constants/animations';
import {
  initSocket,
  onSongQueued,
  onSongNowPlaying,
  onSongRejected,
  onSongSkipped,
  onQueueUpdated,
  off,
} from '@/services/socket';
import { songsAPI } from '@/services/api';
import { DEBUG_EVENT_NAME } from '@/components/debug/SongCardDebugModal';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { readStoredJson } from '@/utils/storage';
import type { Song } from '@/types/songs';

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

function toPlayerSong(song: Song): NowPlayingSong {
  return {
    id: song._id,
    title: song.title || 'Queued Song',
    artist: song.artist || 'Unknown Artist',
    status: song.status === 'PLAYING' ? 'playing' : 'queued',
    progress: 0,
    currentTime: '0:00',
    duration: song.duration ? formatTime(song.duration) : '0:00',
    durationSec: song.duration || 0,
    startedAt: song.playingStartedAt
      ? new Date(song.playingStartedAt).getTime()
      : undefined,
  };
}

function sortQueueSongs(songs: Song[]): Song[] {
  const order: Record<string, number> = {
    PLAYING: 0,
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

export function NowPlayingSection() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSong | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const [tempStatus, setTempStatus] = useState<NowPlayingSong | null>(null);
  const [attentionKey, setAttentionKey] = useState(0);
  const [celebrateKey, setCelebrateKey] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tempStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showTemporaryStatus = (status: NowPlayingSong) => {
    if (tempStatusTimeoutRef.current) {
      clearTimeout(tempStatusTimeoutRef.current);
    }
    setTempStatus(status);
    tempStatusTimeoutRef.current = setTimeout(() => setTempStatus(null), 2000);
  };

  /* Tick every second so progress/elapsed advance smoothly */
  useEffect(() => {
    if (nowPlaying?.status === 'playing' && nowPlaying.startedAt) {
      const updateElapsed = () => {
        setElapsedSeconds(
          Math.max(0, (Date.now() - nowPlaying.startedAt) / 1000),
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
  }, [nowPlaying?.id, nowPlaying?.status, nowPlaying?.startedAt]);

  useEffect(() => {
    return () => {
      if (tempStatusTimeoutRef.current) {
        clearTimeout(tempStatusTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
    if (eventData?.eventId) {
      setEventId(eventData.eventId);

      const fetchQueue = async () => {
        try {
          const queueData = await songsAPI.getQueue(eventData.eventId);
          if (!queueData) return;

          const sortedQueue = sortQueueSongs(queueData);
          setQueue(sortedQueue);

          const playing = sortedQueue.find((song) => song.status === 'PLAYING');
          if (playing) {
            setNowPlaying(toPlayerSong(playing));
          }
        } catch (error) {
          console.error('Error fetching queue:', error);
        }
      };

      fetchQueue();
    }
  }, []);

  useEffect(() => {
    if (!eventId) return;

    initSocket();

    const handleSongQueued = (data: any) => {
      /* Song was added to the queue (NOT immediate playback) */
      const newSong: NowPlayingSong = {
        id: data.songId,
        title: data.title || 'Queued',
        artist: data.artist || '',
        status: 'queued',
        progress: 0,
        currentTime: '0:00',
        duration: data.duration ? formatTime(data.duration) : '0:00',
        durationSec: data.duration,
      };

      setQueue((prev) =>
        sortQueueSongs([
          ...prev.filter((song) => song._id !== data.songId),
          {
            _id: data.songId,
            title: newSong.title,
            artist: newSong.artist,
            voteScore: data.voteScore || 0,
            status: 'QUEUED',
            duration: data.duration,
            queuePosition: data.queuePosition,
            requestedBy: data.requestedBy,
          },
        ]),
      );
      setAttentionKey((key) => key + 1);
    };

    const handleSongNowPlaying = (data: any) => {
      const startedAt = data.playingStartedAt
        ? new Date(data.playingStartedAt).getTime()
        : Date.now();
      setNowPlaying({
        id: data.songId,
        title: data.title || 'Now Playing…',
        artist: data.artist || '',
        status: 'playing',
        progress: 0,
        currentTime: '0:00',
        duration: data.duration ? formatTime(data.duration) : '0:00',
        durationSec: data.duration,
        startedAt,
      });
      setQueue((prev) => prev.filter((song) => song._id !== data.songId));
      setCelebrateKey((key) => key + 1);
    };

    const handleSongRejected = (data: any) => {
      showTemporaryStatus({
        id: data.songId,
        title: 'Song Rejected',
        artist: data.reason || 'No reason provided',
        status: 'rejected',
      });
      if (data?.songId) {
        setQueue((prev) => prev.filter((song) => song._id !== data.songId));
        setNowPlaying((prev) => (prev?.id === data.songId ? null : prev));
      }
    };

    const handleSongSkipped = (data: any) => {
      showTemporaryStatus({
        id: data.songId,
        title: 'Song Skipped',
        artist: data.reason || 'DJ skipped',
        status: 'skipped',
      });
      if (data?.songId) {
        setQueue((prev) => prev.filter((song) => song._id !== data.songId));
        setNowPlaying((prev) => (prev?.id === data.songId ? null : prev));
      }
    };

    const handleQueueUpdated = (data: any) => {
      if (Array.isArray(data.queue)) {
        setQueue(sortQueueSongs(data.queue));
        if (data.queue.some((song: Song) => song.status !== 'PLAYING')) {
          setAttentionKey((key) => key + 1);
        }
      }

      /* Prefer nowPlaying metadata from enhanced event */
      if (data.nowPlaying && data.nowPlaying.songId) {
        const np = data.nowPlaying;
        const startedAt = np.playingStartedAt
          ? new Date(np.playingStartedAt).getTime()
          : Date.now() - (np.elapsedTime || 0) * 1000;
        setNowPlaying({
          id: np.songId,
          title: np.title,
          artist: np.artist,
          status: 'playing',
          progress: np.duration
            ? Math.min(100, ((np.elapsedTime || 0) / np.duration) * 100)
            : 0,
          currentTime: formatTime(np.elapsedTime || 0),
          duration: formatTime(np.duration || 0),
          durationSec: np.duration,
          startedAt,
        });
      }
    };

    onSongQueued(handleSongQueued);
    onSongNowPlaying(handleSongNowPlaying);
    onSongRejected(handleSongRejected);
    onSongSkipped(handleSongSkipped);
    onQueueUpdated(handleQueueUpdated);

    const handleDebugSongEvent = (event: Event) => {
      const { type, payload } = (event as CustomEvent).detail || {};
      if (type === 'song_approved') handleSongQueued(payload);
      if (type === 'song_now_playing') handleSongNowPlaying(payload);
      if (type === 'song_rejected') handleSongRejected(payload);
      if (type === 'song_skipped') handleSongSkipped(payload);
      if (type === 'queue_updated') handleQueueUpdated(payload);
    };

    if (isDebugModeEnabled()) {
      window.addEventListener(DEBUG_EVENT_NAME, handleDebugSongEvent);
    }

    return () => {
      off('song_approved', handleSongQueued);
      off('song_now_playing', handleSongNowPlaying);
      off('song_rejected', handleSongRejected);
      off('song_skipped', handleSongSkipped);
      off('queue_updated', handleQueueUpdated);
      window.removeEventListener(DEBUG_EVENT_NAME, handleDebugSongEvent);
    };
  }, [eventId]);

  /* Compute live elapsed/progress when playing */
  const queuedPreview = sortQueueSongs(queue).find(
    (song) => song.status !== 'PLAYING',
  );

  let display: NowPlayingSong | typeof NOW_PLAYING =
    tempStatus ||
    nowPlaying ||
    (queuedPreview ? toPlayerSong(queuedPreview) : NOW_PLAYING);

  if (
    !tempStatus &&
    nowPlaying &&
    nowPlaying.status === 'playing' &&
    nowPlaying.startedAt &&
    nowPlaying.durationSec
  ) {
    const elapsed = elapsedSeconds;
    const progress = Math.min(100, (elapsed / nowPlaying.durationSec) * 100);
    display = {
      ...nowPlaying,
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
                  const sorted = sortQueueSongs(queue).filter(
                    (song) => song.status !== 'PLAYING',
                  );
                  const previewIndex = sorted.findIndex(
                    (song) => song._id === display.id,
                  );
                  let wait = 0;
                  if (
                    nowPlaying?.status === 'playing' &&
                    nowPlaying.startedAt &&
                    nowPlaying.durationSec
                  ) {
                    const elapsed = Math.max(
                      0,
                      elapsedSeconds,
                    );
                    wait = Math.max(0, nowPlaying.durationSec - elapsed);
                  }
                  for (const song of sorted.slice(0, Math.max(0, previewIndex))) {
                    wait += song.duration || 0;
                  }
                  return wait <= 0
                    ? 'Up Next'
                    : `Starts in ~${formatWait(wait)}`;
                })()
              : undefined
          }
          attentionKey={attentionKey}
          celebrateKey={celebrateKey}
        />
      </motion.div>
    </motion.div>
  );
}
