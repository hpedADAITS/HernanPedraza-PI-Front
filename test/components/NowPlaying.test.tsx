import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { NowPlaying } from '@/components/common/NowPlaying';

describe('NowPlaying', () => {
  it.each([
    ['idle', 'NO SONG PLAYING'],
    ['queued', 'QUEUED'],
    ['playing', 'NOW PLAYING'],
    ['rejected', 'REJECTED'],
    ['skipped', 'SKIPPED'],
  ] as const)('renders the %s state', (status, label) => {
    render(
      <NowPlaying
        status={status}
        songTitle="Test Song"
        artist="Test Artist"
        currentTime="0:12"
        duration="3:20"
        progress={12}
      />,
    );

    expect(screen.getByText(label)).toBeInTheDocument();
    if (status === 'idle') {
      expect(screen.getByText('No song playing')).toBeInTheDocument();
      expect(
        screen.getByText('Approve requests into the queue, then choose the next song to play'),
      ).toBeInTheDocument();
      return;
    }

    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });

  it('shows elapsed time only while a song is playing', () => {
    const { rerender } = render(
      <NowPlaying
        status="queued"
        songTitle="Queued Song"
        artist="Queued Artist"
        currentTime="0:12"
        duration="3:20"
      />,
    );

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('3:20')).toBeInTheDocument();
    expect(screen.queryByText('0:12')).not.toBeInTheDocument();

    rerender(
      <NowPlaying
        status="playing"
        songTitle="Playing Song"
        artist="Playing Artist"
        currentTime="0:12"
        duration="3:20"
      />,
    );

    expect(screen.getByText('0:12')).toBeInTheDocument();
  });
});
