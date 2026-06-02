import type { NormalizedNowPlaying, NowPlayingEventPayload, QueueUpdatedPayload, SongEventPayload } from './contracts';
import type { Song, SongStatus } from '@/types/songs';

function getSongId(payload: SongEventPayload) {
  return payload.songId ?? payload._id ?? payload.id ?? null;
}

function getDuration(payload: SongEventPayload) {
  const duration = payload.totalDuration ?? payload.duration;
  return Number.isFinite(duration) ? duration : undefined;
}

export function normalizeSocketSong(
  payload: SongEventPayload,
  fallbackStatus: SongStatus | string,
  fallbackEventId?: string | null,
): Song | null {
  const songId = getSongId(payload);
  if (!songId) return null;

  const duration = getDuration(payload);
  return {
    _id: songId,
    title: payload.title || 'Untitled song',
    artist: payload.artist || 'Unknown artist',
    voteScore: payload.voteScore || 0,
    status: payload.status || fallbackStatus,
    duration,
    totalDuration: duration,
    queuePosition: payload.queuePosition,
    requestedBy: payload.requestedBy || null,
    recognitionMatch: payload.recognitionMatch || null,
    eventId: payload.eventId || fallbackEventId || undefined,
    playingStartedAt: payload.playingStartedAt ?? payload.startedPlayingAt,
  };
}

export function normalizeNowPlaying(
  payload?: NowPlayingEventPayload | null,
): NormalizedNowPlaying | null {
  if (!payload) return null;

  const songId = getSongId(payload);
  if (!songId) return null;

  const duration = getDuration(payload) ?? 0;
  return {
    songId,
    title: payload.title || 'Now Playing...',
    artist: payload.artist || '',
    duration,
    totalDuration: getDuration(payload),
    startedAt: payload.playingStartedAt
      ? new Date(payload.playingStartedAt).getTime()
      : payload.startedPlayingAt
        ? new Date(payload.startedPlayingAt).getTime()
        : Date.now() - (payload.elapsedTime || 0) * 1000,
    elapsedTime: payload.elapsedTime,
    albumArt: payload.recognitionMatch?.coverUrl || null,
  };
}

export function normalizeQueueUpdated(payload: QueueUpdatedPayload) {
  return {
    queue: Array.isArray(payload.queue) ? payload.queue : null,
    nowPlaying: normalizeNowPlaying(payload.nowPlaying),
  };
}
