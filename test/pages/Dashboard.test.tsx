import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Dashboard } from '@/pages/Dashboard';
import { writeStoredJson, readStoredJson } from '@/utils/storage';

const {
  callbackRegistry,
  initSocketMock,
  disconnectSocketMock,
  eventsApiGetEventMock,
  toastInfoMock,
} = vi.hoisted(() => {
  const registry = new Map<string, Array<(data: unknown) => void>>();

  return {
    callbackRegistry: registry,
    initSocketMock: vi.fn(),
    disconnectSocketMock: vi.fn(),
    eventsApiGetEventMock: vi.fn(),
    toastInfoMock: vi.fn(),
  };
});

vi.mock('@/components/layout/Layout', () => ({
  Layout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/common/Logo', () => ({
  Logo: () => <div>Logo</div>,
}));

vi.mock('@/components/dashboard', () => ({
  DJProfileCard: () => <div>DJProfileCard</div>,
  AttendeeProfileCard: () => <div>AttendeeProfileCard</div>,
  QueueList: () => <div>QueueList</div>,
  SearchBar: () => <div>SearchBar</div>,
  ActionButtons: () => <div>ActionButtons</div>,
  NowPlayingSection: () => <div>NowPlayingSection</div>,
  ConnectedUsers: () => <div>ConnectedUsers</div>,
}));

vi.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => [false],
}));

vi.mock('sonner', () => ({
  toast: {
    info: toastInfoMock,
  },
}));

vi.mock('@/services/socket', () => ({
  initSocket: initSocketMock,
  joinEvent: vi.fn(),
  on: vi.fn((event: string, callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get(event) ?? [];
    callbacks.push(callback);
    callbackRegistry.set(event, callbacks);
  }),
  onAccessCodeUpdated: vi.fn((callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get('access_code_updated') ?? [];
    callbacks.push(callback);
    callbackRegistry.set('access_code_updated', callbacks);
  }),
  onEventUpdated: vi.fn((callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get('event_updated') ?? [];
    callbacks.push(callback);
    callbackRegistry.set('event_updated', callbacks);
  }),
  onSongSuggested: vi.fn((callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get('song_suggested') ?? [];
    callbacks.push(callback);
    callbackRegistry.set('song_suggested', callbacks);
  }),
  onEventEnded: vi.fn((callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get('event_ended') ?? [];
    callbacks.push(callback);
    callbackRegistry.set('event_ended', callbacks);
  }),
  off: vi.fn((event: string, callback?: (data: unknown) => void) => {
    if (!callback) {
      callbackRegistry.delete(event);
      return;
    }
    const callbacks = callbackRegistry.get(event) ?? [];
    callbackRegistry.set(
      event,
      callbacks.filter((registered) => registered !== callback),
    );
  }),
  disconnectSocket: disconnectSocketMock,
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    eventsAPI: {
      ...actual.eventsAPI,
      getEvent: eventsApiGetEventMock,
    },
  };
});

function emit(event: string, payload: unknown) {
  for (const callback of callbackRegistry.get(event) ?? []) {
    callback(payload);
  }
}

function seedStorage() {
  writeStoredJson('currentEvent', {
    eventId: 'event-1',
    ownerName: 'DJ Nova',
    accessCode: 'ACCESS1',
  });
  writeStoredJson('currentParticipant', {
    _id: 'attendee-1',
    nickname: 'Bailey',
  });
  localStorage.setItem('authToken', 'token-123');
}

describe('Dashboard attendee admin effects', () => {
  beforeEach(() => {
    localStorage.clear();
    callbackRegistry.clear();
    vi.clearAllMocks();
    seedStorage();
    eventsApiGetEventMock.mockResolvedValue({
      accessCode: 'ACCESS1',
      ownerId: { profilePicture: null },
    });
    initSocketMock.mockReturnValue({
      connected: true,
      on: vi.fn(),
      once: vi.fn(),
      off: vi.fn(),
    });
  });

  it('clears attendee event session and navigates away when the current attendee is kicked', async () => {
    const onNavigate = vi.fn();

    render(<Dashboard mode="attendee" onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(eventsApiGetEventMock).toHaveBeenCalledWith('event-1');
    });

    emit('participant_kicked', {
      participantId: 'attendee-1',
      reason: 'Kicked by DJ',
    });

    await waitFor(() => {
      expect(disconnectSocketMock).toHaveBeenCalled();
      expect(onNavigate).toHaveBeenCalledWith('attendee-login');
    });
    expect(readStoredJson('currentEvent')).toBeNull();
    expect(readStoredJson('currentParticipant')).toBeNull();
    expect(localStorage.getItem('authToken')).toBe('token-123');
  });

  it('ignores kick events for other attendees', async () => {
    const onNavigate = vi.fn();

    render(<Dashboard mode="attendee" onNavigate={onNavigate} />);

    await waitFor(() => {
      expect(eventsApiGetEventMock).toHaveBeenCalledWith('event-1');
    });

    emit('participant_kicked', {
      participantId: 'attendee-9',
      reason: 'Kicked by DJ',
    });

    await waitFor(() => {
      expect(disconnectSocketMock).not.toHaveBeenCalled();
      expect(onNavigate).not.toHaveBeenCalled();
    });
    expect(readStoredJson('currentEvent')).toEqual(
      expect.objectContaining({ eventId: 'event-1' }),
    );
    expect(readStoredJson('currentParticipant')).toEqual(
      expect.objectContaining({ _id: 'attendee-1' }),
    );
  });
});
