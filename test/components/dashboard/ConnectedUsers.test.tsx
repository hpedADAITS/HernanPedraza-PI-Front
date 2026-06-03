import { describe, expect, it, beforeEach, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { Socket } from 'socket.io-client';
import { ConnectedUsers } from '@/components/dashboard/ConnectedUsers';
import { participantsAPI } from '@/services/api';
import { getSocket } from '@/services/socket';
import { writeStoredJson } from '@/utils/storage';

vi.mock('@/services/api', () => ({
  participantsAPI: {
    listEventParticipants: vi.fn(),
    setCooldown: vi.fn(),
    kickParticipant: vi.fn(),
  },
}));

vi.mock('@/services/socket', () => ({
  getSocket: vi.fn(),
}));

const mockParticipantsAPI = vi.mocked(participantsAPI);
const mockGetSocket = vi.mocked(getSocket);

type Handler = (data: unknown) => void;
type SocketMock = Pick<Socket, 'on' | 'off'> & {
  emitEvent: (event: string, data: unknown) => void;
};

function createSocketMock(): SocketMock {
  const handlers = new Map<string, Handler>();

  return {
    on: vi.fn((event: string, handler: Handler) => {
      handlers.set(event, handler);
    }),
    off: vi.fn((event: string) => {
      handlers.delete(event);
    }),
    emitEvent: (event: string, data: unknown) => {
      handlers.get(event)?.(data);
    },
  };
}

function setDashboardStorage() {
  writeStoredJson('currentEvent', {
    eventId: 'event-1',
    ownerName: 'DJ Nova',
    ownerProfilePicture: 'data:image/png;base64,dj-picture',
  });
  writeStoredJson('currentParticipant', {
    _id: 'attendee-2',
    nickname: 'Bailey',
  });
}

function setDjDashboardStorage() {
  writeStoredJson('user', {
    id: 'dj-user',
    role: 'DJ',
  });
  writeStoredJson('currentParticipant', {
    _id: 'dj-participant',
    nickname: 'DJ Nova',
  });
}

describe('Connected Users dashboard UI', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setDashboardStorage();
    mockGetSocket.mockReturnValue(null);
  });

  it('renders attendee view with the DJ, the current user, and other attendees', async () => {
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-1',
        nickname: 'Alex',
        profilePicture: 'data:image/png;base64,alex-picture',
        joinedAt: '2026-05-21T10:00:00.000Z',
        socketId: 'socket-1',
        isPremium: true,
      },
      {
        _id: 'attendee-2',
        nickname: 'Bailey',
        joinedAt: '2026-05-21T10:01:00.000Z',
        socketId: 'socket-2',
      },
      {
        _id: 'attendee-3',
        nickname: 'Casey',
        joinedAt: '2026-05-21T10:02:00.000Z',
      },
    ]);

    render(<ConnectedUsers mode="attendee" />);

    expect(await screen.findByText('DJ Nova')).toBeInTheDocument();
    expect(screen.getByAltText('DJ Nova profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,dj-picture',
    );
    expect(screen.getByAltText('Alex profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,alex-picture',
    );
    expect(screen.getByText('4 members')).toBeInTheDocument();
    expect(screen.getByText('3/3')).toBeInTheDocument();
    expect(screen.getAllByText('You')).toHaveLength(2);
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Casey')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority attendee')).toBeInTheDocument();
    expect(screen.queryByText('Bailey')).not.toBeInTheDocument();
  });

  it('uses the updated profile picture for the current user', async () => {
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-2',
        nickname: 'Bailey',
        profilePicture: 'data:image/png;base64,old-picture',
        joinedAt: '2026-05-21T10:01:00.000Z',
      },
    ]);

    render(
      <ConnectedUsers
        mode="attendee"
        currentProfilePicture="data:image/png;base64,new-picture"
      />,
    );

    expect(await screen.findByAltText('You profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,new-picture',
    );
  });

  it('updates attendee users when participants join and leave over the socket', async () => {
    const socket = createSocketMock();
    mockGetSocket.mockReturnValue(socket as Socket);
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-2',
        nickname: 'Bailey',
        joinedAt: '2026-05-21T10:01:00.000Z',
        socketId: 'socket-2',
      },
    ]);

    render(<ConnectedUsers mode="attendee" />);

    expect(await screen.findByText('DJ Nova')).toBeInTheDocument();
    expect(screen.getByText('2 members')).toBeInTheDocument();

    act(() => {
      socket.emitEvent('participant_joined', {
        participantId: 'attendee-4',
        nickname: 'Drew',
        profilePicture: 'data:image/png;base64,drew-picture',
        joinedAt: '2026-05-21T10:03:00.000Z',
        isPremium: true,
      });
    });

    expect(await screen.findByText('Drew')).toBeInTheDocument();
    expect(screen.getByAltText('Drew profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,drew-picture',
    );
    expect(screen.getByText('3 members')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority attendee')).toBeInTheDocument();

    act(() => {
      socket.emitEvent('participant_left', {
        participantId: 'attendee-4',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Drew')).not.toBeInTheDocument();
    });
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  it('updates attendee names and avatars over the socket', async () => {
    const socket = createSocketMock();
    mockGetSocket.mockReturnValue(socket as Socket);
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-1',
        nickname: 'Alex',
        profilePicture: 'data:image/png;base64,old-picture',
        joinedAt: '2026-05-21T10:00:00.000Z',
        socketId: 'socket-1',
      },
    ]);

    render(<ConnectedUsers mode="attendee" />);

    expect(await screen.findByText('Alex')).toBeInTheDocument();

    act(() => {
      socket.emitEvent('participant_updated', {
        participantId: 'attendee-1',
        nickname: 'Avery',
        profilePicture: 'data:image/png;base64,new-picture',
      });
    });

    expect(await screen.findByText('Avery')).toBeInTheDocument();
    expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    expect(screen.getByAltText('Avery profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,new-picture',
    );
  });

  it('keeps attendee-only DJ identity section out of DJ mode', async () => {
    setDjDashboardStorage();
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([]);

    render(<ConnectedUsers mode="dj" />);

    expect(await screen.findByText('Connected Users')).toBeInTheDocument();
    expect(screen.queryByText('DJ Nova')).not.toBeInTheDocument();
  });

  it('renders DJ connected users with total, connected count, premium count, and premium-first ordering', async () => {
    setDjDashboardStorage();
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-1',
        nickname: 'Alex',
        joinedAt: new Date(Date.now() - 90_000).toISOString(),
        isPremium: false,
        socketId: 'socket-1',
      },
      {
        _id: 'attendee-2',
        nickname: 'Bailey',
        userId: {
          profilePicture: 'data:image/png;base64,bailey-picture',
        },
        joinedAt: new Date(Date.now() - 30_000).toISOString(),
        isPremium: true,
      },
      {
        _id: 'attendee-3',
        nickname: 'Casey',
        joinedAt: new Date(Date.now() - 3_600_000).toISOString(),
        isPremium: false,
        socketId: 'socket-3',
      },
    ]);

    render(<ConnectedUsers mode="dj" />);

    expect(await screen.findByText('Connected Users')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Premium (Priority) Queue')).toBeInTheDocument();
    expect(screen.getByAltText('Bailey profile')).toHaveAttribute(
      'src',
      'data:image/png;base64,bailey-picture',
    );

    const totalCard = screen.getByText('Total').closest('div');
    const premiumCard = screen.getByText('Premium (Priority) Queue').closest('div');
    if (!totalCard || !premiumCard) {
      throw new Error('Expected DJ stat cards to render');
    }
    expect(within(totalCard).getByText('3')).toBeInTheDocument();
    expect(within(premiumCard).getByText('1')).toBeInTheDocument();

    const names = screen
      .getAllByText(/Alex|Bailey|Casey/)
      .map((node) => node.textContent);
    expect(names).toEqual(['Bailey', 'Alex', 'Casey']);
  });

  it('keeps a cooldowned attendee visible in DJ mode and removes them only when kicked', async () => {
    setDjDashboardStorage();
    const socket = createSocketMock();
    mockGetSocket.mockReturnValue(socket as Socket);
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([
      {
        _id: 'attendee-1',
        nickname: 'Alex',
        joinedAt: '2026-05-21T10:00:00.000Z',
        isPremium: false,
        socketId: 'socket-1',
      },
      {
        _id: 'attendee-2',
        nickname: 'Bailey',
        joinedAt: '2026-05-21T10:01:00.000Z',
        isPremium: false,
        socketId: 'socket-2',
      },
    ]);

    render(<ConnectedUsers mode="dj" />);

    expect(await screen.findByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Bailey')).toBeInTheDocument();

    act(() => {
      socket.emitEvent('participant_cooldown', {
        participantId: 'attendee-1',
        cooldownUntil: '2026-05-21T10:10:00.000Z',
      });
    });

    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Bailey')).toBeInTheDocument();

    act(() => {
      socket.emitEvent('participant_kicked', {
        participantId: 'attendee-1',
      });
    });

    await waitFor(() => {
      expect(screen.queryByText('Alex')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Bailey')).toBeInTheDocument();
  });

  it('renders the DJ empty state when no attendees have joined', async () => {
    setDjDashboardStorage();
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([]);

    render(<ConnectedUsers mode="dj" />);

    expect(await screen.findByText('No participants yet')).toBeInTheDocument();
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });

  it('keeps DJ-only stats out of attendee mode', async () => {
    mockParticipantsAPI.listEventParticipants.mockResolvedValue([]);

    render(<ConnectedUsers mode="attendee" />);

    expect(await screen.findByText('Connected Users')).toBeInTheDocument();
    expect(screen.queryByText('Premium (Priority) Queue')).not.toBeInTheDocument();
  });
});
