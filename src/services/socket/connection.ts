import io, { Socket } from 'socket.io-client';
import { SocketEventName, SocketListener } from './contracts';

// @ts-ignore
const SOCKET_URL: string | undefined =
  import.meta.env?.VITE_USE_DEV_PROXY === 'true'
    ? undefined
    : import.meta.env?.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;
let eventListeners: Map<SocketEventName, SocketListener<SocketEventName>[]> = new Map();

function getAuthToken(token?: string) {
  return token || localStorage.getItem('authToken') || undefined;
}

function bindLifecycleHandlers(nextSocket: Socket) {
  nextSocket.on('connect', () => {
    /* Socket connected */
  });

  nextSocket.on('disconnect', () => {
    /* Socket disconnected */
  });

  nextSocket.on('error', () => {
    /* Handle socket error silently */
  });
}

function rebindStoredListeners(nextSocket: Socket) {
  eventListeners.forEach((listeners, event) => {
    listeners.forEach((listener) => {
      nextSocket.on(event, listener);
    });
  });
}

export function initSocket(token?: string) {
  const authToken = getAuthToken(token);

  if (socket) {
    const currentToken = (socket.auth as { token?: string } | undefined)?.token;
    if (currentToken === authToken) {
      return socket;
    }

    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: authToken,
    },
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
  });
  socket.auth = { token: authToken };

  bindLifecycleHandlers(socket);
  rebindStoredListeners(socket);

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

export function getEventListeners(): Map<SocketEventName, SocketListener<SocketEventName>[]> {
  return eventListeners;
}
