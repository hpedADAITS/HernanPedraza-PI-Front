import type { NormalizedNowPlaying, NowPlayingEventPayload, QueueUpdatedPayload, SongEventPayload } from './contracts';
import type { Song, SongStatus } from '@/types/songs';

function getSongId(payload: SongEventPayload) {
  return payload.songId ?? payload.id ?? payload._id ?? null;
}

function getDuration(payload: SongEventPayload) {
  return Number.isFinite(payload.totalDuration) ? payload.totalDuration : undefined;
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
    voteCount: payload.voteCount,
    status: payload.status || fallbackStatus,
    totalDuration: duration,
    queuePosition: payload.queuePosition,
    isPremiumSuggestion: payload.isPremiumSuggestion,
    requestedBy: payload.requestedBy || null,
    recognitionMatch: payload.recognitionMatch || null,
    eventId: payload.eventId || fallbackEventId || undefined,
    startedAt: payload.startedAt || null,
  };
}

export function normalizeNowPlaying(
  payload?: NowPlayingEventPayload | null,
): NormalizedNowPlaying | null {
  if (!payload) return null;

  const songId = getSongId(payload);
  if (!songId) return null;

  const totalDuration = getDuration(payload);
  const startedAtTs = payload.startedAt
    ? new Date(payload.startedAt).getTime()
    : Date.now() - (payload.elapsedTime || 0) * 1000;
  return {
    songId,
    title: payload.title || 'Now Playing...',
    artist: payload.artist || '',
    totalDuration,
    startedAt: startedAtTs,
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
