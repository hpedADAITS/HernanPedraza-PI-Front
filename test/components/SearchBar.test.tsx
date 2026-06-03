import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SearchBar } from '@/components/dashboard/SearchBar';

const { getPhoneMicrophoneLinkMock } = vi.hoisted(() => ({
  getPhoneMicrophoneLinkMock: vi.fn(),
}));

vi.mock('@/hooks/useMicrophone', () => ({
  useMicrophone: () => ({
    dismissMicrophoneIssue: vi.fn(),
    error: 'No suitable microphone was found.',
    isAccessDenied: true,
    isListening: false,
    isNoSuitableMicFound: true,
    requestMicrophoneAccess: vi.fn(),
    stopMicrophone: vi.fn(),
    stream: null,
  }),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    eventsAPI: {
      ...actual.eventsAPI,
      getPhoneMicrophoneLink: getPhoneMicrophoneLinkMock,
    },
  };
});

vi.mock('@/services/socket', () => ({
  off: vi.fn(),
  onPhoneMicrophoneConnected: vi.fn(),
}));

describe('SearchBar phone microphone fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads a phone link when no microphone is detected', async () => {
    getPhoneMicrophoneLinkMock.mockResolvedValue(
      'https://192.168.1.50:5173/dj/microphone/event-1?token=abc',
    );

    render(<SearchBar onNavigate={vi.fn()} isDj eventId="event-1" />);

    await waitFor(() => {
      expect(getPhoneMicrophoneLinkMock).toHaveBeenCalledWith('event-1');
    });
    expect(await screen.findByText(/192\.168\.1\.50/)).toBeInTheDocument();
  });
});
