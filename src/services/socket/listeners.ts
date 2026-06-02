import type { Socket } from 'socket.io-client';
import { initSocket, getSocketInstance, getEventListeners } from './connection';
import { SocketEventName, SocketEventPayloads, SocketListener } from './contracts';

/* ============ EVENT LISTENERS ============ */

export function on<Event extends SocketEventName>(event: Event, callback: SocketListener<Event>) {
  const s = getSocketInstance() || initSocket();
  if (!s) return;
  const untypedSocket = s as Socket<Record<string, never>, Record<string, (...args: unknown[]) => void>> & {
    on(event: SocketEventName, callback: (...args: unknown[]) => void): void;
  };
  const socketCallback = callback as (...args: unknown[]) => void;

  const eventListeners = getEventListeners();

  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }

  const listeners = eventListeners.get(event)!;
  const storedCallback = callback as SocketListener<SocketEventName>;
  if (listeners.includes(storedCallback)) {
    return;
  }

  listeners.push(storedCallback);
  untypedSocket.on(event, socketCallback);
}

export function off<Event extends SocketEventName>(event: Event, callback?: SocketListener<Event>) {
  const socket = getSocketInstance();
  if (!socket) return;

  const eventListeners = getEventListeners();

  if (callback) {
    const storedCallback = callback as SocketListener<SocketEventName>;
    const untypedSocket = socket as Socket<Record<string, never>, Record<string, (...args: unknown[]) => void>> & {
      off(event: SocketEventName, callback: (...args: unknown[]) => void): void;
    };
    const socketCallback = callback as (...args: unknown[]) => void;
    untypedSocket.off(event, socketCallback);
    const listeners = eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(storedCallback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  } else {
    socket.off(event);
    eventListeners.delete(event);
  }
}

/* ============ LISTENER HELPERS ============ */

type Listener<Event extends SocketEventName> = (data: SocketEventPayloads[Event]) => void;

export function onParticipantJoined(callback: Listener<'participant_joined'>) {
  on('participant_joined', callback);
}

export function onParticipantLeft(callback: Listener<'participant_left'>) {
  on('participant_left', callback);
}

export function onVotesUpdated(callback: Listener<'votes_updated'>) {
  on('votes_updated', callback);
}

export function onSongSuggested(callback: Listener<'song_suggested'>) {
  on('song_suggested', callback);
}

export function onSongApproved(callback: Listener<'song_approved'>) {
  on('song_approved', callback);
}

/** @deprecated Usar onSongApproved; el servidor emite `song_approved`. */
export function onSongQueued(callback: Listener<'song_approved'>) {
  on('song_approved', callback);
}

export function onSongNowPlaying(callback: Listener<'song_now_playing'>) {
  on('song_now_playing', callback);
}

export function onSongRejected(callback: Listener<'song_rejected'>) {
  on('song_rejected', callback);
}

export function onSongSkipped(callback: Listener<'song_skipped'>) {
  on('song_skipped', callback);
}

export function onQueueUpdated(callback: Listener<'queue_updated'>) {
  on('queue_updated', callback);
}

export function onSocketError(callback: Listener<'error'>) {
  on('error', callback);
}

export function onAccessCodeUpdated(callback: Listener<'access_code_updated'>) {
  on('access_code_updated', callback);
}

export function onEventUpdated(callback: Listener<'event_updated'>) {
  on('event_updated', callback);
}

export function onEventEnded(callback: Listener<'event_ended'>) {
  on('event_ended', callback);
}

export function onParticipantPremiumUpdated(callback: Listener<'participant_premium_updated'>) {
  on('participant_premium_updated', callback);
}

export function onParticipantUpdated(callback: Listener<'participant_updated'>) {
  on('participant_updated', callback);
}

export function onAttendeePasswordPromptRequested(callback: Listener<'attendee_password_prompt_requested'>) {
  on('attendee_password_prompt_requested', callback);
}

export function onPhoneMicrophoneConnected(callback: Listener<'phone_microphone_connected'>) {
  on('phone_microphone_connected', callback);
}
