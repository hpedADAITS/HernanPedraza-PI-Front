import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConnectedUsers } from '@/components/dashboard/ConnectedUsers';
import { writeStoredJson } from '@/utils/storage';

const { kickParticipantMock, listEventParticipantsMock, setCooldownMock } = vi.hoisted(() => ({
  kickParticipantMock: vi.fn(),
  listEventParticipantsMock: vi.fn(),
  setCooldownMock: vi.fn(),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    participantsAPI: {
      ...actual.participantsAPI,
      kickParticipant: kickParticipantMock,
      listEventParticipants: listEventParticipantsMock,
      setCooldown: setCooldownMock,
    },
  };
});

vi.mock('@/services/socket', () => ({
  getSocket: () => ({
    on: vi.fn(),
    off: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    promise: (promise: Promise<unknown>) => promise,
  },
}));

describe('ConnectedUsers DJ moderation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    writeStoredJson('user', {
      id: 'dj-user',
      role: 'DJ',
    });
    writeStoredJson('currentEvent', {
      eventId: 'event-1',
    });
    writeStoredJson('currentParticipant', {
      _id: 'dj-participant',
      eventId: 'event-1',
    });
  });

  it('uses id fallback for cooldown and kick actions', async () => {
    listEventParticipantsMock.mockResolvedValue([
      {
        id: 'attendee-1',
        nickname: 'Riley',
        joinedAt: new Date().toISOString(),
      },
    ]);
    setCooldownMock.mockResolvedValue({});
    kickParticipantMock.mockResolvedValue({});

    render(<ConnectedUsers mode="dj" />);

    const row = (await screen.findByText('Riley')).closest('.cursor-pointer');
    if (!row) throw new Error('Expected participant row');

    fireEvent.click(row);
    await screen.findByLabelText('Cooldown duration');
    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(setCooldownMock).toHaveBeenCalledWith(
        'attendee-1',
        expect.any(Number),
        'DJ cooldown',
      );
    });

    fireEvent.click(row);
    await screen.findByLabelText('Cooldown duration');
    fireEvent.click(screen.getAllByRole('button')[1]);

    await waitFor(() => {
      expect(kickParticipantMock).toHaveBeenCalledWith('attendee-1', 'Kicked by DJ');
    });
  });
});
