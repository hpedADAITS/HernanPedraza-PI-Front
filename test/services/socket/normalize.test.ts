import { describe, expect, it } from 'vitest';
import { normalizeNowPlaying } from '@/services/socket/normalize';

describe('normalizeNowPlaying', () => {
  it('accepts playingStartedAt and keeps elapsed timing', () => {
    const startedAt = '2026-06-09T20:00:00.000Z';
    const normalized = normalizeNowPlaying({
      songId: 'song-1',
      title: 'Sandstorm',
      artist: 'Darude',
      totalDuration: 120,
      playingStartedAt: startedAt,
      elapsedTime: 13,
      timestamp: '2026-06-09T20:00:13.000Z',
    });

    expect(normalized).toMatchObject({
      songId: 'song-1',
      title: 'Sandstorm',
      artist: 'Darude',
      totalDuration: 120,
      startedAt: new Date(startedAt).getTime(),
      elapsedTime: 13,
      remainingTime: 107,
    });
  });
});
