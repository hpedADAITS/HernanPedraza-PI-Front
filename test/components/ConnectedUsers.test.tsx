import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConnectedUsers } from '@/components/dashboard/ConnectedUsers';
import { writeStoredJson } from '@/utils/storage';

const {
  clearCooldownAckMock,
  kickParticipantAckMock,
  listEventParticipantsMock,
  setCooldownAckMock,
} = vi.hoisted(() => ({
  clearCooldownAckMock: vi.fn(),
  kickParticipantAckMock: vi.fn(),
  listEventParticipantsMock: vi.fn(),
  setCooldownAckMock: vi.fn(),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    participantsAPI: {
      ...actual.participantsAPI,
      listEventParticipants: listEventParticipantsMock,
    },
  };
});

vi.mock('@/services/socket/emitters', () => ({
  clearCooldownAck: clearCooldownAckMock,
  kickParticipantAck: kickParticipantAckMock,
  setCooldownAck: setCooldownAckMock,
}));

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
    setCooldownAckMock.mockResolvedValue({});
    kickParticipantAckMock.mockResolvedValue({});

    render(<ConnectedUsers mode="dj" />);

    const row = (await screen.findByText('Riley')).closest('.cursor-pointer');
    if (!row) throw new Error('Expected participant row');

    fireEvent.click(row);
    await screen.findByLabelText('Cooldown duration');
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Reason' }), {
      target: { value: 'Too many requests' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply cooldown' }));

    await waitFor(() => {
      expect(setCooldownAckMock).toHaveBeenCalledWith(
        'event-1',
        'attendee-1',
        expect.any(Number),
        'Too many requests',
      );
    });

    fireEvent.click(screen.getAllByRole('button')[1]);

    await waitFor(() => {
      expect(kickParticipantAckMock).toHaveBeenCalledWith(
        'event-1',
        'attendee-1',
        'Kicked by DJ',
      );
    });
  });

  it('toggles cooldown off on second cooldown click', async () => {
    listEventParticipantsMock.mockResolvedValue([
      {
        id: 'attendee-1',
        nickname: 'Riley',
        joinedAt: new Date().toISOString(),
      },
    ]);
    setCooldownAckMock.mockResolvedValue({
      cooldownUntil: '2099-01-01T00:00:00.000Z',
    });
    clearCooldownAckMock.mockResolvedValue({});

    render(<ConnectedUsers mode="dj" />);

    const row = (await screen.findByText('Riley')).closest('.cursor-pointer');
    if (!row) throw new Error('Expected participant row');

    fireEvent.click(row);
    await screen.findByLabelText('Cooldown duration');
    fireEvent.click(screen.getAllByRole('button')[0]);
    fireEvent.change(await screen.findByRole('textbox', { name: 'Reason' }), {
      target: { value: 'Spam' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply cooldown' }));

    await waitFor(() => {
      expect(setCooldownAckMock).toHaveBeenCalledWith(
        'event-1',
        'attendee-1',
        expect.any(Number),
        'Spam',
      );
    });

    fireEvent.click(screen.getAllByRole('button')[0]);

    await waitFor(() => {
      expect(clearCooldownAckMock).toHaveBeenCalledWith('event-1', 'attendee-1');
    });
  });
});
