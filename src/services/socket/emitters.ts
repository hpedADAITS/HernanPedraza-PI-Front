import { getSocketInstance } from './connection';

/* ============ PARTICIPATION ============ */

export function joinEvent(
  eventId: string,
  participantId: string,
  nickname: string,
  profilePicture?: string | null,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('join_event', { eventId, participantId, nickname, profilePicture });
}

export function leaveEvent(eventId: string, participantId: string) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('leave_event', { eventId, participantId });
}

/* ============ VOTING ============ */

export function castVote(
  eventId: string,
  songId: string,
  participantId: string,
  value: number,
) {
  return emitWithAck('cast_vote', { eventId, songId, participantId, value });
}

export function removeVote(
  eventId: string,
  songId: string,
  participantId: string,
) {
  return emitWithAck('remove_vote', { eventId, songId, participantId });
}

/* ============ SONGS ============ */

export function suggestSong(
  eventId: string,
  title: string,
  artist: string,
  participantId: string,
  nickname: string,
  totalDuration?: number,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('suggest_song', {
    eventId,
    title,
    artist,
    participantId,
    nickname,
    totalDuration,
  });
}

export function approveSong(eventId: string, songId: string) {
  const socket = getSocketInstance();
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('approve_song', { eventId, songId });
}

export function sendNowSong(
  eventId: string,
  songId: string,
  title?: string,
  artist?: string,
) {
  const socket = getSocketInstance();
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('send_now', { eventId, songId, title, artist });
}

export function rejectSong(eventId: string, songId: string, reason: string) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('reject_song', { eventId, songId, reason });
}

export function skipSong(eventId: string, songId: string, reason: string) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('skip_song', { eventId, songId, reason });
}

export function updateQueue(_eventId: string, _queue: unknown[]) {
  throw new Error('Queue updates must come from backend state changes');
}

/* ============ PARTICIPANT ADMIN ============ */

export function setCooldown(
  eventId: string,
  participantId: string,
  durationMs: number,
  reason?: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('set_cooldown', { eventId, participantId, durationMs, reason });
}

export function kickParticipant(
  eventId: string,
  participantId: string,
  reason?: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('kick_participant', { eventId, participantId, reason });
}

export function banParticipant(
  eventId: string,
  participantId: string,
  reason?: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('ban_participant', { eventId, participantId, reason });
}

export function setPremium(participantId: string, isPremium: boolean) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('set_premium', { participantId, isPremium });
}

/* ============ ADMIN ACTIONS (Promise-based with acknowledgment) ============ */

interface AckResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

function emitWithAck<T>(event: string, data: unknown): Promise<T> {
  const socket = getSocketInstance();
  if (!socket) return Promise.reject(new Error('Socket not initialized'));
  if (!socket.connected) return Promise.reject(new Error('Socket is not connected'));
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (response: AckResponse<T>) => {
      if (response.success) {
        resolve(response.data as T);
      } else {
        reject(new Error(response.error || 'Action failed'));
      }
    });
  });
}

export function setCooldownAck(
  eventId: string,
  participantId: string,
  durationMs: number,
  reason?: string,
): Promise<unknown> {
  return emitWithAck('set_cooldown', { eventId, participantId, durationMs, reason });
}

export function clearCooldownAck(
  eventId: string,
  participantId: string,
): Promise<unknown> {
  return emitWithAck('clear_cooldown', { eventId, participantId });
}

export function kickParticipantAck(
  eventId: string,
  participantId: string,
  reason?: string,
): Promise<unknown> {
  return emitWithAck('kick_participant', { eventId, participantId, reason });
}

export function banParticipantAck(
  eventId: string,
  participantId: string,
  reason?: string,
): Promise<unknown> {
  return emitWithAck('ban_participant', { eventId, participantId, reason });
}

export function setPremiumAck(
  participantId: string,
  isPremium: boolean,
): Promise<unknown> {
  return emitWithAck('set_premium', { participantId, isPremium });
}
