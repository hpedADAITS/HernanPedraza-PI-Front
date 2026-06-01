import { beforeEach, describe, expect, it, vi } from 'vitest';
import { disconnectSocket, getEventListeners, getSocket, initSocket } from '@/services/socket/connection';
import { approveSong, castVote, joinEvent, sendNowSong } from '@/services/socket/emitters';
import { off, onParticipantJoined, onSongApproved } from '@/services/socket/listeners';

const socketIoMock = vi.hoisted(() => vi.fn());

vi.mock('socket.io-client', () => ({
  default: socketIoMock,
  io: socketIoMock,
}));

function createSocketDouble(connected = false) {
  return {
    connected,
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  };
}

describe('socket service', () => {
  beforeEach(() => {
    disconnectSocket();
    getEventListeners().clear();
    localStorage.clear();
    socketIoMock.mockReset();
  });

  it('initializes Socket.IO with an explicit token and registers lifecycle handlers', () => {
    const socket = createSocketDouble();
    socketIoMock.mockReturnValue(socket);

    const result = initSocket('explicit-token');

    expect(result).toBe(socket);
    expect(getSocket()).toBe(socket);
    expect(socketIoMock).toHaveBeenCalledWith(undefined, {
      auth: {
        token: 'explicit-token',
      },
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
    });
    expect(socket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  it('falls back to the stored auth token when initializing', () => {
    localStorage.setItem('authToken', 'stored-token');
    socketIoMock.mockReturnValue(createSocketDouble());

    initSocket();

    expect(socketIoMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        auth: {
          token: 'stored-token',
        },
      }),
    );
  });

  it('reuses an already connected socket', () => {
    const connectedSocket = createSocketDouble(true);
    socketIoMock.mockReturnValue(connectedSocket);

    expect(initSocket()).toBe(connectedSocket);
    expect(initSocket()).toBe(connectedSocket);
    expect(socketIoMock).toHaveBeenCalledTimes(1);
  });

  it('rebinds registered listeners when recreating the socket with a new token', () => {
    const firstSocket = createSocketDouble(true);
    const secondSocket = createSocketDouble(true);
    socketIoMock.mockReturnValueOnce(firstSocket).mockReturnValueOnce(secondSocket);
    const approvedCallback = vi.fn();

    initSocket('first-token');
    onSongApproved(approvedCallback);
    initSocket('second-token');

    expect(firstSocket.disconnect).toHaveBeenCalled();
    expect(secondSocket.on).toHaveBeenCalledWith(
      'song_approved',
      approvedCallback,
    );
  });

  it('emits participation, vote, and song events through the real emitter functions', () => {
    const socket = createSocketDouble();
    socketIoMock.mockReturnValue(socket);
    initSocket();

    joinEvent('event-1', 'participant-1', 'Nora');
    castVote('event-1', 'song-1', 'participant-1', 1);
    approveSong('event-1', 'song-1');
    sendNowSong('event-1', 'song-1', 'Track', 'Artist');

    expect(socket.emit).toHaveBeenCalledWith('join_event', {
      eventId: 'event-1',
      participantId: 'participant-1',
      nickname: 'Nora',
      profilePicture: undefined,
    });
    expect(socket.emit).toHaveBeenCalledWith('cast_vote', {
      eventId: 'event-1',
      songId: 'song-1',
      participantId: 'participant-1',
      value: 1,
    });
    expect(socket.emit).toHaveBeenCalledWith('approve_song', {
      eventId: 'event-1',
      songId: 'song-1',
    });
    expect(socket.emit).toHaveBeenCalledWith('send_now', {
      eventId: 'event-1',
      songId: 'song-1',
      title: 'Track',
      artist: 'Artist',
    });
  });

  it('throws when an emitter is used before the socket is initialized', () => {
    expect(() => joinEvent('event-1', 'participant-1', 'Nora')).toThrow(
      'Socket not initialized',
    );
  });

  it('registers and removes real listener callbacks', () => {
    const socket = createSocketDouble();
    socketIoMock.mockReturnValue(socket);
    const joinedCallback = vi.fn();
    const approvedCallback = vi.fn();

    onParticipantJoined(joinedCallback);
    onSongApproved(approvedCallback);

    expect(socket.on).toHaveBeenCalledWith('participant_joined', joinedCallback);
    expect(socket.on).toHaveBeenCalledWith('song_approved', approvedCallback);
    expect(getEventListeners().get('participant_joined')).toEqual([
      joinedCallback,
    ]);
    expect(getEventListeners().get('song_approved')).toEqual([
      approvedCallback,
    ]);

    off('participant_joined', joinedCallback);
    off('song_approved');

    expect(socket.off).toHaveBeenCalledWith(
      'participant_joined',
      joinedCallback,
    );
    expect(socket.off).toHaveBeenCalledWith('song_approved');
    expect(getEventListeners().get('participant_joined')).toEqual([]);
    expect(getEventListeners().has('song_approved')).toBe(false);
  });

  it('disconnects and clears the socket instance', () => {
    const socket = createSocketDouble();
    socketIoMock.mockReturnValue(socket);
    initSocket();

    disconnectSocket();

    expect(socket.disconnect).toHaveBeenCalled();
    expect(getSocket()).toBeNull();
  });
});
