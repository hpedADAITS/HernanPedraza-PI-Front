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
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('cast_vote', { eventId, songId, participantId, value });
}

export function removeVote(
  eventId: string,
  songId: string,
  participantId: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('remove_vote', { eventId, songId, participantId });
}

/* ============ SONGS ============ */

export function suggestSong(
  eventId: string,
  songId: string,
  title: string,
  artist: string,
  participantId: string,
  nickname: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('suggest_song', {
    eventId,
    title,
    artist,
    participantId,
    nickname,
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

export function updateQueue(_eventId: string, _queue: any[]) {
  throw new Error('Queue updates must come from backend state changes');
}
