import type { NormalizedNowPlaying, NowPlayingEventPayload, QueueUpdatedPayload, SongEventPayload } from './contracts';
import type { Song, SongStatus } from '@/types/songs';

function getSongId(payload: SongEventPayload) {
  return payload.songId ?? payload.id ?? payload._id ?? null;
}

function getDuration(payload: SongEventPayload) {
  return Number.isFinite(payload.totalDuration) ? payload.totalDuration : undefined;
}

function getStartedAt(payload: SongEventPayload) {
  const startedAt =
    payload.startedAt ||
    payload.playingStartedAt ||
    payload.startedPlayingAt ||
    null;
  return startedAt ? new Date(startedAt).getTime() : null;
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
    downvoteCount: payload.downvoteCount || 0,
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
  const startedAtTs = getStartedAt(payload);
  const elapsedTime = Number.isFinite(payload.elapsedTime)
    ? Math.max(0, Math.floor(Number(payload.elapsedTime)))
    : startedAtTs
      ? Math.max(0, Math.floor((Date.now() - startedAtTs) / 1000))
      : undefined;
  return {
    songId,
    title: payload.title || 'Now Playing...',
    artist: payload.artist || '',
    totalDuration,
    startedAt: startedAtTs || Date.now(),
    elapsedTime,
    remainingTime:
      totalDuration != null && elapsedTime != null
        ? Math.max(0, totalDuration - elapsedTime)
        : payload.remainingTime,
    albumArt: payload.recognitionMatch?.coverUrl || payload.albumArt || null,
  };
}

export function normalizeQueueUpdated(payload: QueueUpdatedPayload) {
  return {
    queue: Array.isArray(payload.queue) ? payload.queue : null,
    nowPlaying: normalizeNowPlaying(payload.nowPlaying),
  };
}
