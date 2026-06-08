import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useParticipantCooldown } from '@/hooks/useParticipantCooldown';

const { getParticipantMock, listeners } = vi.hoisted(() => ({
  getParticipantMock: vi.fn(),
  listeners: new Map<string, (payload: unknown) => void>(),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    participantsAPI: {
      ...actual.participantsAPI,
      getParticipant: getParticipantMock,
    },
  };
});

vi.mock('@/services/socket', () => ({
  on: vi.fn((event: string, callback: (payload: unknown) => void) => {
    listeners.set(event, callback);
  }),
  off: vi.fn((event: string) => {
    listeners.delete(event);
  }),
}));

describe('useParticipantCooldown', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
    getParticipantMock.mockResolvedValue({ cooldownUntil: null });
  });

  it('clears attendee cooldown when uncooldown event arrives', async () => {
    const { result } = renderHook(() => useParticipantCooldown('participant-1'));

    await waitFor(() => {
      expect(listeners.has('participant_cooldown')).toBe(true);
      expect(listeners.has('participant_cooldown_cleared')).toBe(true);
    });

    act(() => {
      listeners.get('participant_cooldown')?.({
        participantId: 'participant-1',
        cooldownUntil: new Date(Date.now() + 60000).toISOString(),
      });
    });

    expect(result.current.isCoolingDown).toBe(true);

    act(() => {
      listeners.get('participant_cooldown_cleared')?.({
        participantId: 'participant-1',
      });
    });

    expect(result.current.isCoolingDown).toBe(false);
    expect(result.current.cooldownUntil).toBeNull();
  });
});
