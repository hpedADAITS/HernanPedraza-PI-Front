import { initSocket, getSocketInstance, getEventListeners } from './connection';

// ============ EVENT LISTENERS ============

export function on(event: string, callback: (data: any) => void) {
  const s = getSocketInstance() || initSocket();
  if (!s) return;

  const eventListeners = getEventListeners();

  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }

  eventListeners.get(event)!.push(callback);
  s.on(event, callback);
}

export function off(event: string, callback?: (data: any) => void) {
  const socket = getSocketInstance();
  if (!socket) return;

  const eventListeners = getEventListeners();

  if (callback) {
    socket.off(event, callback);
    const listeners = eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  } else {
    socket.off(event);
    eventListeners.delete(event);
  }
}

// ============ LISTENER HELPERS ============

export function onParticipantJoined(callback: (data: any) => void) {
  on('participant_joined', callback);
}

export function onParticipantLeft(callback: (data: any) => void) {
  on('participant_left', callback);
}

export function onVotesUpdated(callback: (data: any) => void) {
  on('votes_updated', callback);
}

export function onSongSuggested(callback: (data: any) => void) {
  on('song_suggested', callback);
}

export function onSongApproved(callback: (data: any) => void) {
  on('song_approved', callback);
}

export function onSongRejected(callback: (data: any) => void) {
  on('song_rejected', callback);
}

export function onSongSkipped(callback: (data: any) => void) {
  on('song_skipped', callback);
}

export function onQueueUpdated(callback: (data: any) => void) {
  on('queue_updated', callback);
}

export function onSocketError(callback: (data: any) => void) {
  on('error', callback);
}
