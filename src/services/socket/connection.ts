import io, { Socket } from 'socket.io-client';

// @ts-ignore
const SOCKET_URL: string = import.meta.env?.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let eventListeners: Map<string, Function[]> = new Map();

export function initSocket(token?: string) {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token || localStorage.getItem('authToken') || undefined,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    // Socket connected
  });

  socket.on('disconnect', () => {
    // Socket disconnected
  });

  socket.on('error', (error) => {
    // Handle socket error silently
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

export function getSocketInstance(): Socket | null {
  return socket;
}

export function getEventListeners(): Map<string, Function[]> {
  return eventListeners;
}