import { io, type Socket } from 'socket.io-client';
import { SocketEventName, SocketListener } from './contracts';

// @ts-ignore
const VITE_API_URL: string | undefined =
  import.meta.env?.VITE_API_URL || undefined;

let socket: Socket | null = null;

const eventListeners: Map<
  SocketEventName,
  SocketListener<SocketEventName>[]
> = new Map();

export function buildSocketUrl(apiUrl?: string) {
  if (!apiUrl) { throw new Error('Missing VITE_API_URL'); }

  const trimmed = apiUrl.replace(/\/+$/, '');

  return trimmed.endsWith('/api/v1')
    ? trimmed.slice(0, -'/api/v1'.length)
    : trimmed;
}

const SOCKET_URL = buildSocketUrl(VITE_API_URL);

function getAuthToken(token?: string) {
  return token || localStorage.getItem('authToken') || undefined;
}

function bindLifecycleHandlers(nextSocket: Socket) {
  nextSocket.on('connect', () => {
    console.info('Socket connected', {
      id: nextSocket.id,
      transport: nextSocket.io.engine.transport.name,
      url: SOCKET_URL,
    });
  });

  nextSocket.io.engine.on('upgrade', () => {
    console.info('Socket transport upgraded', {
      transport: nextSocket.io.engine.transport.name,
    });
  });

  nextSocket.on('disconnect', (reason) => {
    console.warn('Socket disconnected', {
      reason,
    });
  });

  nextSocket.on('connect_error', (error) => {
    console.error('Socket connect_error', {
      message: error.message,
      name: error.name,
      url: SOCKET_URL,
      transport: nextSocket.io.engine.transport.name,
    });
  });

  nextSocket.on('error', (error) => {
    console.error('Socket error', error);
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
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    auth: {
      token: authToken,
    },
    reconnection: true,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    reconnectionAttempts: Number.POSITIVE_INFINITY,
    timeout: 20000,
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

export function getEventListeners(): Map<
  SocketEventName,
  SocketListener<SocketEventName>[]
> {
  return eventListeners;
}