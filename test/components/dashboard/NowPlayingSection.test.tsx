import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { NowPlayingSection } from '@/components/dashboard/NowPlayingSection';

const {
  audioMatchUpdateCallbacks,
  phoneMicrophoneConnectedCallbacks,
  phoneMicrophoneDisconnectedCallbacks,
  lastNowPlayingProps,
  songsApiGetQueueMock,
} = vi.hoisted(() => {
  const audioMatchUpdateCallbacks: Array<(data: unknown) => void> = [];
  const phoneMicrophoneConnectedCallbacks: Array<(data: unknown) => void> = [];
  const phoneMicrophoneDisconnectedCallbacks: Array<(data: unknown) => void> = [];
  const lastNowPlayingProps: { current: Record<string, unknown> | null } = {
    current: null,
  };
  return {
    audioMatchUpdateCallbacks,
    phoneMicrophoneConnectedCallbacks,
    phoneMicrophoneDisconnectedCallbacks,
    lastNowPlayingProps,
    songsApiGetQueueMock: vi.fn(),
  };
});

vi.mock('@/services/socket', () => ({
  initSocket: vi.fn(),
  off: vi.fn(),
  onAudioMatchChunk: vi.fn(),
  onAudioMatchUpdate: vi.fn((callback: (data: unknown) => void) => {
    audioMatchUpdateCallbacks.push(callback);
  }),
  onAudioMatchUpdateCallback: vi.fn(),
  onPhoneAudioStream: vi.fn(),
  onPhoneMicrophoneConnected: vi.fn((callback: (data: unknown) => void) => {
    phoneMicrophoneConnectedCallbacks.push(callback);
  }),
  onPhoneMicrophoneDisconnected: vi.fn((callback: (data: unknown) => void) => {
    phoneMicrophoneDisconnectedCallbacks.push(callback);
  }),
  onQueueUpdated: vi.fn(),
  onSongNowPlaying: vi.fn(),
  onSongQueued: vi.fn(),
  onSongRejected: vi.fn(),
  onSongSkipped: vi.fn(),
  onSongSuggested: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  songsAPI: {
    getQueue: (...args: unknown[]) => songsApiGetQueueMock(...args),
  },
}));

vi.mock('@/utils/debugSongEvents', () => ({
  listenDebugSongEvents: () => () => undefined,
}));

vi.mock('@/services/session', () => ({
  getStoredEventId: () => 'event-123',
}));

vi.mock('@/hooks/useTrackedTimeout', () => ({
  useTrackedTimeout: () => ({
    clearTrackedTimeout: vi.fn(),
    setTrackedTimeout: (handler: () => void) => setTimeout(handler, 0),
  }),
}));

vi.mock('@/components/common', () => ({
  NowPlaying: (props: Record<string, unknown>) => {
    lastNowPlayingProps.current = props;
    const disconnected = Boolean(props.microphoneDisconnected);
    const label = props.microphoneLabel
      ? disconnected
        ? `${props.microphoneLabel} disconnected`
        : String(props.microphoneLabel)
      : '';
    return (
      <div data-testid="now-playing">
        <span data-testid="np-status">{String(props.status ?? '')}</span>
        <span data-testid="np-title">{String(props.songTitle ?? '')}</span>
        <span data-testid="np-artist">{String(props.artist ?? '')}</span>
        <span data-testid="np-album-art">{String(props.albumArt ?? '')}</span>
        <span data-testid="np-microphone-label">{label}</span>
        <span data-testid="np-microphone-disconnected">
          {disconnected ? 'true' : 'false'}
        </span>
      </div>
    );
  },
}));

describe('NowPlayingSection - audio_match_update', () => {
  beforeEach(() => {
    audioMatchUpdateCallbacks.length = 0;
    phoneMicrophoneConnectedCallbacks.length = 0;
    phoneMicrophoneDisconnectedCallbacks.length = 0;
    lastNowPlayingProps.current = null;
    songsApiGetQueueMock.mockReset();
    songsApiGetQueueMock.mockResolvedValue([]);
  });

  it('subscribes to audio_match_update on mount', async () => {
    render(<NowPlayingSection />);

    await waitFor(() => {
      expect(audioMatchUpdateCallbacks.length).toBeGreaterThan(0);
    });
  });

  it('renders the matched track info when a fingerprint match is found', async () => {
    render(<NowPlayingSection />);

    await waitFor(() => {
      expect(audioMatchUpdateCallbacks.length).toBeGreaterThan(0);
    });

    act(() => {
      audioMatchUpdateCallbacks[0]({
        eventId: 'event-123',
        matches: [
          {
            trackId: 'track-1',
            title: 'Sandstorm',
            artist: 'Darude',
            coverUrl: 'https://example.com/cover.jpg',
            duration: 240,
            offset: 0,
            score: 0.95,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-status').textContent).toBe('matched');
    });
    expect(screen.getByTestId('np-title').textContent).toBe('Sandstorm');
    expect(screen.getByTestId('np-artist').textContent).toBe('Darude');
    expect(screen.getByTestId('np-album-art').textContent).toBe(
      'https://example.com/cover.jpg',
    );
  });

  it('clears the matched track info when the song starts playing', async () => {
    const songNowPlayingCallbacks: Array<(data: unknown) => void> = [];
    const socketModule = await import('@/services/socket');
    (socketModule.onSongNowPlaying as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (callback: (data: unknown) => void) => {
        songNowPlayingCallbacks.push(callback);
      },
    );

    render(<NowPlayingSection />);

    await waitFor(() => {
      expect(audioMatchUpdateCallbacks.length).toBeGreaterThan(0);
      expect(songNowPlayingCallbacks.length).toBeGreaterThan(0);
    });

    act(() => {
      audioMatchUpdateCallbacks[0]({
        eventId: 'event-123',
        matches: [
          {
            trackId: 'track-1',
            title: 'Sandstorm',
            artist: 'Darude',
            coverUrl: null,
            duration: null,
            offset: 0,
            score: 0.95,
          },
        ],
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-status').textContent).toBe('matched');
    });

    act(() => {
      songNowPlayingCallbacks[0]({
        songId: 'song-1',
        title: 'Sandstorm',
        artist: 'Darude',
        status: 'PLAYING',
        totalDuration: 240,
        duration: 240,
        playingStartedAt: new Date().toISOString(),
        recognitionMatch: {
          trackId: 'track-1',
          title: 'Sandstorm',
          artist: 'Darude',
          coverUrl: 'https://example.com/cover.jpg',
          score: 0.95,
          matchedOn: 'title_artist',
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-status').textContent).toBe('playing');
    });
    expect(screen.getByTestId('np-title').textContent).toBe('Sandstorm');
  });
});

describe('NowPlayingSection - phone microphone lifecycle', () => {
  beforeEach(() => {
    audioMatchUpdateCallbacks.length = 0;
    phoneMicrophoneConnectedCallbacks.length = 0;
    phoneMicrophoneDisconnectedCallbacks.length = 0;
    lastNowPlayingProps.current = null;
    songsApiGetQueueMock.mockReset();
    songsApiGetQueueMock.mockResolvedValue([]);
  });

  it('switches the pill to disconnected when the phone microphone socket drops', async () => {
    render(<NowPlayingSection />);

    await waitFor(() => {
      expect(phoneMicrophoneConnectedCallbacks.length).toBeGreaterThan(0);
      expect(phoneMicrophoneDisconnectedCallbacks.length).toBeGreaterThan(0);
    });

    act(() => {
      phoneMicrophoneConnectedCallbacks[0]({
        eventId: 'event-123',
        deviceName: 'iPhone microphone',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-microphone-disconnected').textContent).toBe(
        'false',
      );
      expect(screen.getByTestId('np-microphone-label').textContent).toBe(
        'iPhone microphone',
      );
    });

    act(() => {
      phoneMicrophoneDisconnectedCallbacks[0]({
        eventId: 'event-123',
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-microphone-disconnected').textContent).toBe(
        'true',
      );
      expect(screen.getByTestId('np-microphone-label').textContent).toBe(
        'iPhone microphone disconnected',
      );
    });
  });

  it('clears the disconnected flag when a new connection arrives', async () => {
    render(<NowPlayingSection />);

    await waitFor(() => {
      expect(phoneMicrophoneConnectedCallbacks.length).toBeGreaterThan(0);
      expect(phoneMicrophoneDisconnectedCallbacks.length).toBeGreaterThan(0);
    });

    act(() => {
      phoneMicrophoneConnectedCallbacks[0]({
        eventId: 'event-123',
        deviceName: 'iPhone microphone',
      });
    });
    act(() => {
      phoneMicrophoneDisconnectedCallbacks[0]({
        eventId: 'event-123',
        timestamp: new Date().toISOString(),
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-microphone-disconnected').textContent).toBe(
        'true',
      );
    });

    act(() => {
      phoneMicrophoneConnectedCallbacks[0]({
        eventId: 'event-123',
        deviceName: 'iPhone microphone',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('np-microphone-disconnected').textContent).toBe(
        'false',
      );
      expect(screen.getByTestId('np-microphone-label').textContent).toBe(
        'iPhone microphone',
      );
    });
  });
});
