import { getSocketInstance } from './connection';

/* ============ PARTICIPATION ============ */

export function joinEvent(
  eventId: string,
  participantId: string,
  nickname: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('join_event', { eventId, participantId, nickname });
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
  socket.emit('vote_cast', { eventId, songId, participantId, value });
}

export function removeVote(
  eventId: string,
  songId: string,
  participantId: string,
) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('vote_removed', { eventId, songId, participantId });
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
  socket.emit('song_suggested', {
    eventId,
    songId,
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
  socket.emit('song_approved', { eventId, songId });
}

export function sendNowSong(eventId: string, songId: string) {
  const socket = getSocketInstance();
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('song_now_playing', { eventId, songId });
}

export function rejectSong(eventId: string, songId: string, reason: string) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('song_rejected', { eventId, songId, reason });
}

export function skipSong(eventId: string, songId: string, reason: string) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('song_skipped', { eventId, songId, reason });
}

export function updateQueue(eventId: string, queue: any[]) {
  const socket = getSocketInstance();
  if (!socket) throw new Error('Socket not initialized');
  socket.emit('queue_updated', { eventId, queue });
}
