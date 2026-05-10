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

interface QueueSong {
  id: string;
  title: string;
  artist: string;
  status?: string;
  eventId?: string;
}

function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function NowPlayingSection() {
  const [nowPlaying, setNowPlaying] = useState<NowPlayingSong | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [, setQueue] = useState<QueueSong[]>([]);
  const [tempStatus, setTempStatus] = useState<NowPlayingSong | null>(null);
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Tick every second so progress/elapsed advance smoothly */
  useEffect(() => {
    if (nowPlaying?.status === 'playing' && nowPlaying.startedAt) {
      tickRef.current = setInterval(() => setTick((t) => t + 1), 1000);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }
    return undefined;
  }, [nowPlaying?.id, nowPlaying?.status, nowPlaying?.startedAt]);

  useEffect(() => {
    const eventData = localStorage.getItem('currentEvent');
    if (eventData) {
      const parsed = JSON.parse(eventData);
      setEventId(parsed.eventId);

      const fetchQueue = async () => {
        try {
          const queueData = await songsAPI.getQueue(parsed.eventId);
          if (queueData) {
            setQueue(queueData);
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
      setNowPlaying((prev) =>
        prev ?? {
          id: data.songId,
          title: data.title || 'Queued',
          artist: data.artist || '',
          status: 'queued',
          progress: 0,
          currentTime: '0:00',
          duration: data.duration ? formatTime(data.duration) : '0:00',
          durationSec: data.duration,
        },
      );
    };

    const handleSongNowPlaying = (data: any) => {
      const startedAt = data.playingStartedAt
        ? new Date(data.playingStartedAt).getTime()
        : Date.now();
      setNowPlaying({
        id: data.songId,
        title: data.title || 'Now Playing...',
        artist: data.artist || '',
        status: 'playing',
        progress: 0,
        currentTime: '0:00',
        duration: data.duration ? formatTime(data.duration) : '0:00',
        durationSec: data.duration,
        startedAt,
      });
    };

    const handleSongRejected = (data: any) => {
      setTempStatus({
        id: data.songId,
        title: 'Song Rejected',
        artist: data.reason || 'No reason provided',
        status: 'rejected',
      });
      setTimeout(() => setTempStatus(null), 2000);
    };

    const handleSongSkipped = (data: any) => {
      setTempStatus({
        id: data.songId,
        title: 'Song Skipped',
        artist: data.reason || 'DJ skipped',
        status: 'skipped',
      });
      setTimeout(() => setTempStatus(null), 2000);
    };

    const handleQueueUpdated = (data: any) => {
      if (data.queue) setQueue(data.queue);

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

    return () => {
      off('song_queued', handleSongQueued);
      off('song_now_playing', handleSongNowPlaying);
      off('song_rejected', handleSongRejected);
      off('song_skipped', handleSongSkipped);
      off('queue_updated', handleQueueUpdated);
    };
  }, [eventId]);

  /* Compute live elapsed/progress when playing */
  let display: NowPlayingSong | typeof NOW_PLAYING =
    tempStatus || nowPlaying || NOW_PLAYING;

  if (
    !tempStatus &&
    nowPlaying &&
    nowPlaying.status === 'playing' &&
    nowPlaying.startedAt &&
    nowPlaying.durationSec
  ) {
    const elapsed = Math.max(0, (Date.now() - nowPlaying.startedAt) / 1000);
    const progress = Math.min(100, (elapsed / nowPlaying.durationSec) * 100);
    display = {
      ...nowPlaying,
      progress,
      currentTime: formatTime(elapsed),
    };
    /* tick is read implicitly to trigger re-renders */
    void tick;
  }

  return (
    <motion.div
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex-1 flex items-center justify-center min-h-[200px]"
    >
      <motion.div
        className="w-full max-w-2xl"
        key={`${display.id}-${display.status}`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <NowPlaying
          songTitle={display.title}
          artist={display.artist}
          status={display.status}
          progress={display.progress}
          currentTime={display.currentTime}
          duration={display.duration}
        />
      </motion.div>
    </motion.div>
  );
}
