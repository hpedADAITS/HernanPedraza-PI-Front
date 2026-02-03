import io, { Socket } from "socket.io-client";

// @ts-ignore
const SOCKET_URL: string = (import.meta.env?.VITE_API_URL as string | undefined) || "http://localhost:5000";

let socket: Socket | null = null;
let eventListeners: Map<string, Function[]> = new Map();

export function initSocket(token?: string) {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token || localStorage.getItem("authToken") || undefined,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

// ============ PARTICIPATION ============

export function joinEvent(eventId: string, participantId: string, nickname: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("join_event", { eventId, participantId, nickname });
}

export function leaveEvent(eventId: string, participantId: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("leave_event", { eventId, participantId });
}

// ============ VOTING ============

export function castVote(eventId: string, songId: string, participantId: string, value: number) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("vote_cast", { eventId, songId, participantId, value });
}

export function removeVote(eventId: string, songId: string, participantId: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("vote_removed", { eventId, songId, participantId });
}

// ============ SONGS ============

export function suggestSong(eventId: string, songId: string, title: string, artist: string, participantId: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("song_suggested", { eventId, songId, title, artist, participantId });
}

export function approveSong(eventId: string, songId: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("song_approved", { eventId, songId });
}

export function rejectSong(eventId: string, songId: string, reason: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("song_rejected", { eventId, songId, reason });
}

export function skipSong(eventId: string, songId: string, reason: string) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("song_skipped", { eventId, songId, reason });
}

export function updateQueue(eventId: string, queue: any[]) {
  if (!socket) throw new Error("Socket not initialized");
  socket.emit("queue_updated", { eventId, queue });
}

// ============ EVENT LISTENERS ============

export function on(event: string, callback: (data: any) => void) {
  if (!socket) throw new Error("Socket not initialized");

  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }

  eventListeners.get(event)!.push(callback);
  socket.on(event, callback);
}

export function off(event: string, callback?: (data: any) => void) {
  if (!socket) return;

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
  on("participant_joined", callback);
}

export function onParticipantLeft(callback: (data: any) => void) {
  on("participant_left", callback);
}

export function onVotesUpdated(callback: (data: any) => void) {
  on("votes_updated", callback);
}

export function onSongSuggested(callback: (data: any) => void) {
  on("song_suggested", callback);
}

export function onSongApproved(callback: (data: any) => void) {
  on("song_approved", callback);
}

export function onSongRejected(callback: (data: any) => void) {
  on("song_rejected", callback);
}

export function onSongSkipped(callback: (data: any) => void) {
  on("song_skipped", callback);
}

export function onQueueUpdated(callback: (data: any) => void) {
  on("queue_updated", callback);
}

export function onSocketError(callback: (data: any) => void) {
  on("error", callback);
}
