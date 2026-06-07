import type { AudioTrack } from '@/services/api/audioTracks';

const PREFIX = 'djCoverArt:v1';
const DATA_IMAGE = /^data:image\/[a-z0-9.+-]+;base64,/i;

function key(eventId: string, trackId: string, cacheKey: string) {
  return `${PREFIX}:${eventId}:${trackId}:${cacheKey}`;
}

function eventPrefix(eventId: string) {
  return `${PREFIX}:${eventId}:`;
}

export function cachedCoverKeys(eventId: string) {
  if (typeof sessionStorage === 'undefined') return [];
  const prefix = eventPrefix(eventId);
  const keys: string[] = [];

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const storageKey = sessionStorage.key(i);
    if (!storageKey?.startsWith(prefix)) continue;
    const cacheKey = storageKey.slice(storageKey.lastIndexOf(':') + 1);
    if (cacheKey) keys.push(cacheKey);
  }

  return keys;
}

export function hydrateTrackCover(eventId: string, track: AudioTrack): AudioTrack {
  const cacheKey = track.coverUrlCacheKey;
  if (!cacheKey) return track;

  const storageKey = key(eventId, track.id, cacheKey);
  if (track.coverUrl && DATA_IMAGE.test(track.coverUrl)) {
    try {
      sessionStorage.setItem(storageKey, track.coverUrl);
    } catch {
      clearEventCoverCache(eventId);
      try {
        sessionStorage.setItem(storageKey, track.coverUrl);
      } catch {
        return track;
      }
    }
    return track;
  }

  const cached = sessionStorage.getItem(storageKey);
  return cached ? { ...track, coverUrl: cached } : track;
}

export function forgetTrackCover(eventId: string, track: AudioTrack) {
  if (!track.coverUrlCacheKey || typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(key(eventId, track.id, track.coverUrlCacheKey));
}

export function clearEventCoverCache(eventId?: string | null) {
  if (!eventId || typeof sessionStorage === 'undefined') return;
  const prefix = eventPrefix(eventId);
  const keys = [];

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const storageKey = sessionStorage.key(i);
    if (storageKey?.startsWith(prefix)) keys.push(storageKey);
  }

  keys.forEach((storageKey) => sessionStorage.removeItem(storageKey));
}
