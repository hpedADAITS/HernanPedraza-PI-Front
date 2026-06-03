import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '@/pages/Dashboard';
import { writeStoredJson, readStoredJson } from '@/utils/storage';
import { suspendNextSingleUserSessionCheck } from '@/services/singleUserSession';

const {
  callbackRegistry,
  initSocketMock,
  disconnectSocketMock,
  dashboardSearchBarMock,
  eventsApiCreateEventMock,
  eventsApiGetEventMock,
  eventsApiGetMyActiveEventMock,
  joinEventMock,
  toastInfoMock,
} = vi.hoisted(() => {
  const registry = new Map<string, Array<(data: unknown) => void>>();

  return {
    callbackRegistry: registry,
    initSocketMock: vi.fn(),
    disconnectSocketMock: vi.fn(),
    dashboardSearchBarMock: vi.fn(),
    eventsApiCreateEventMock: vi.fn(),
    eventsApiGetEventMock: vi.fn(),
    eventsApiGetMyActiveEventMock: vi.fn(),
    joinEventMock: vi.fn(),
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
  SearchBar: (props: unknown) => {
    dashboardSearchBarMock(props);
    return <div>SearchBar</div>;
  },
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
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
  })),
  joinEvent: joinEventMock,
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
  onParticipantBanned: vi.fn((callback: (data: unknown) => void) => {
    const callbacks = callbackRegistry.get('participant_banned') ?? [];
    callbacks.push(callback);
    callbackRegistry.set('participant_banned', callbacks);
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
      createEvent: eventsApiCreateEventMock,
      getEvent: eventsApiGetEventMock,
      getMyActiveEvent: eventsApiGetMyActiveEventMock,
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
    eventsApiCreateEventMock.mockResolvedValue({
      id: 'event-created',
      accessCode: 'CREATED',
      ownerId: { _id: 'dj-1', profilePicture: null },
    });
    eventsApiGetEventMock.mockResolvedValue({
      accessCode: 'ACCESS1',
      ownerId: { _id: 'dj-1', profilePicture: null },
    });
    eventsApiGetMyActiveEventMock.mockResolvedValue(null);
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

  it('does not render DJ dashboard from attendee session cache', async () => {
    const onNavigate = vi.fn();

    writeStoredJson('user', {
      id: 'attendee-1',
      displayName: 'Bailey',
      role: 'attendee',
    });

    render(<Dashboard mode="dj" onNavigate={onNavigate} />);

    expect(screen.queryByText('DJProfileCard')).toBeNull();
    expect(dashboardSearchBarMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith('dj-login');
    });
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(readStoredJson('currentEvent')).toBeNull();
    expect(readStoredJson('currentParticipant')).toBeNull();
    expect(initSocketMock).not.toHaveBeenCalled();
  });

  it('renders DJ dashboard from stored event without blocking on active-event lookup', async () => {
    writeStoredJson('user', {
      id: 'dj-1',
      displayName: 'DJ Nova',
      role: 'DJ',
    });
    writeStoredJson('currentEvent', {
      eventId: 'stale-event',
      ownerName: 'Other DJ',
      accessCode: 'OLD',
    });
    writeStoredJson('currentParticipant', {
      _id: 'dj-1',
      nickname: 'DJ Nova',
      eventId: 'stale-event',
    });
    suspendNextSingleUserSessionCheck();
    eventsApiGetEventMock.mockRejectedValue(new Error('Not found'));
    eventsApiGetMyActiveEventMock.mockRejectedValue(new Error('Not found'));

    render(<Dashboard mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(dashboardSearchBarMock).toHaveBeenCalledWith(
        expect.objectContaining({ eventId: 'stale-event', isDj: true }),
      );
    });
    expect(readStoredJson('currentEvent')).toEqual(
      expect.objectContaining({ eventId: 'stale-event' }),
    );
    expect(eventsApiGetMyActiveEventMock).not.toHaveBeenCalled();
  });

  it('replaces stale attendee participant cache before joining as DJ', async () => {
    writeStoredJson('user', {
      id: 'dj-1',
      displayName: 'DJ Nova',
      role: 'DJ',
    });
    writeStoredJson('currentEvent', {
      eventId: 'owned-event',
      ownerName: 'DJ Nova',
      accessCode: 'OWNED',
    });
    writeStoredJson('currentParticipant', {
      _id: 'attendee-1',
      nickname: 'Bailey',
      eventId: 'owned-event',
    });
    suspendNextSingleUserSessionCheck();
    eventsApiGetEventMock.mockResolvedValue({
      id: 'owned-event',
      accessCode: 'OWNED',
      ownerId: { _id: 'dj-1', profilePicture: null },
    });

    render(<Dashboard mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(joinEventMock).toHaveBeenCalledWith(
        'owned-event',
        'dj-1',
        'DJ Nova',
        null,
      );
    });
    expect(readStoredJson('currentParticipant')).toEqual(
      expect.objectContaining({ _id: 'dj-1', eventId: 'owned-event' }),
    );
  });

  it('boots DJ dashboard from id-only session cache', async () => {
    writeStoredJson('user', {
      id: 'dj-1',
      displayName: 'DJ Nova',
      role: 'DJ',
    });
    writeStoredJson('currentEvent', {
      id: 'owned-event',
      ownerName: 'DJ Nova',
      accessCode: 'OWNED',
    });
    writeStoredJson('currentParticipant', {
      id: 'dj-1',
      nickname: 'DJ Nova',
      eventId: 'owned-event',
    });
    suspendNextSingleUserSessionCheck();
    eventsApiGetEventMock.mockResolvedValue({
      id: 'owned-event',
      accessCode: 'OWNED',
      ownerId: { _id: 'dj-1', profilePicture: null },
    });

    render(<Dashboard mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(joinEventMock).toHaveBeenCalledWith(
        'owned-event',
        'dj-1',
        'DJ Nova',
        null,
      );
    });
    expect(screen.queryByText('Session data is incomplete')).toBeNull();
  });

  it('synthesizes missing DJ participant cache from the authenticated user', async () => {
    writeStoredJson('user', {
      id: 'dj-1',
      displayName: 'DJ Nova',
      role: 'DJ',
    });
    writeStoredJson('currentEvent', {
      eventId: 'owned-event',
      ownerName: 'DJ Nova',
      accessCode: 'OWNED',
    });
    localStorage.setItem('authToken', 'token-123');
    suspendNextSingleUserSessionCheck();
    eventsApiGetEventMock.mockRejectedValue(new Error('Not found'));
    eventsApiGetMyActiveEventMock.mockRejectedValue(new Error('Not found'));

    render(<Dashboard mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => {
      expect(joinEventMock).toHaveBeenCalledWith(
        'owned-event',
        'dj-1',
        'DJ Nova',
        null,
      );
    });
    expect(readStoredJson('currentParticipant')).toEqual(
      expect.objectContaining({ _id: 'dj-1', eventId: 'owned-event' }),
    );
  });
});
