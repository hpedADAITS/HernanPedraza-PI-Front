import { isDebugModeEnabled } from './debugMode';

export const DEBUG_EVENT_NAME = 'syncrekuest:debug-song-event';
const DEBUG_CHANNEL_NAME = 'syncrekuest:debug-song-events';
const DEBUG_STORAGE_KEY = 'syncrekuest:debug-song-event:last';

type DebugSongEventDetail = {
  type: string;
  payload: Record<string, any>;
  eventKey?: string;
};

function getChannel() {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) {
    return null;
  }

  return new BroadcastChannel(DEBUG_CHANNEL_NAME);
}

export function dispatchDebugSongEvent(
  type: string,
  payload: Record<string, any>,
) {
  if (!isDebugModeEnabled()) return;

  const detail: DebugSongEventDetail = {
    type,
    payload: {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString(),
    },
    eventKey: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  };

  window.dispatchEvent(new CustomEvent(DEBUG_EVENT_NAME, { detail }));

  const channel = getChannel();
  if (channel) {
    channel.postMessage(detail);
    channel.close();
  }

  try {
    localStorage.setItem(DEBUG_STORAGE_KEY, JSON.stringify(detail));
  } catch {
    /* localStorage may be unavailable in private contexts */
  }
}

export function listenDebugSongEvents(
  callback: (detail: DebugSongEventDetail) => void,
) {
  if (!isDebugModeEnabled()) return () => {};

  const seen = new Set<string>();
  const handleDetail = (detail?: DebugSongEventDetail) => {
    if (!detail?.type || !detail.payload) return;
    if (detail.eventKey) {
      if (seen.has(detail.eventKey)) return;
      seen.add(detail.eventKey);
      if (seen.size > 80) {
        const oldest = seen.values().next().value;
        if (oldest) seen.delete(oldest);
      }
    }
    callback(detail);
  };

  const handleWindowEvent = (event: Event) => {
    handleDetail((event as CustomEvent<DebugSongEventDetail>).detail);
  };

  const channel = getChannel();
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== DEBUG_STORAGE_KEY || !event.newValue) return;
    try {
      handleDetail(JSON.parse(event.newValue));
    } catch {
      /* Ignore malformed debug events */
    }
  };

  window.addEventListener(DEBUG_EVENT_NAME, handleWindowEvent);
  window.addEventListener('storage', handleStorage);
  if (channel) {
    channel.onmessage = (event) => handleDetail(event.data);
  }

  return () => {
    window.removeEventListener(DEBUG_EVENT_NAME, handleWindowEvent);
    window.removeEventListener('storage', handleStorage);
    if (channel) channel.close();
  };
}
