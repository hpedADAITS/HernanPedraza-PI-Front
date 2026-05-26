import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SongSelection } from '@/pages/SongSelection';

const {
  getPendingSongsMock,
  approveSongMock,
  rejectSongMock,
  socketOffMock,
  onSongSuggestedMock,
  onSongApprovedMock,
  onSongRejectedMock,
} = vi.hoisted(() => ({
  getPendingSongsMock: vi.fn(),
  approveSongMock: vi.fn(),
  rejectSongMock: vi.fn(),
  socketOffMock: vi.fn(),
  onSongSuggestedMock: vi.fn(),
  onSongApprovedMock: vi.fn(),
  onSongRejectedMock: vi.fn(),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    songsAPI: {
      ...actual.songsAPI,
      getPendingSongs: getPendingSongsMock,
      approveSong: approveSongMock,
      rejectSong: rejectSongMock,
    },
  };
});

vi.mock('@/services/socket', () => ({
  off: socketOffMock,
  onSongSuggested: onSongSuggestedMock,
  onSongApproved: onSongApprovedMock,
  onSongRejected: onSongRejectedMock,
}));

describe('SongSelection attendee request form', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('keeps the light request card styling by default', () => {
    render(<SongSelection mode="attendee" onNavigate={vi.fn()} />);

    const form = screen.getByText('Request a track').closest('form');
    if (!form) {
      throw new Error('Expected request form to render');
    }

    expect(form.className).toContain(
      'bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfffd_100%)]',
    );
    expect(form.className).toContain('border-slate-900/10');
    expect(form.className).toContain('text-slate-900');

    const submitButton = screen.getByRole('button', { name: 'Suggest Song' });
    expect(submitButton).toBeDisabled();
  });

  it('renders the request card in dark mode and preserves button behavior', () => {
    localStorage.setItem('darkMode', 'true');

    render(<SongSelection mode="attendee" onNavigate={vi.fn()} />);

    const form = screen.getByText('Request a track').closest('form');
    if (!form) {
      throw new Error('Expected request form to render');
    }

    expect(form.className).toContain(
      'bg-[radial-gradient(circle_at_72%_18%,rgba(70,156,255,0.16),transparent_24%),linear-gradient(180deg,#182235_0%,#111827_100%)]',
    );
    expect(form.className).toContain('border-white/10');
    expect(form.className).toContain('text-white');

    const titleInput = screen.getByPlaceholderText('Song title');
    const artistInput = screen.getByPlaceholderText('Artist');
    const submitButton = screen.getByRole('button', { name: 'Suggest Song' });

    expect(titleInput.className).toContain('text-white');
    expect(titleInput.className).toContain('placeholder:text-slate-400');
    expect(artistInput.className).toContain('text-white');
    expect(artistInput.className).toContain('placeholder:text-slate-400');
    expect(submitButton).toBeDisabled();

    fireEvent.change(titleInput, { target: { value: 'Midnight City' } });
    fireEvent.change(artistInput, { target: { value: 'M83' } });

    expect(submitButton).toBeEnabled();
    expect(submitButton.className).toContain('bg-emerald-500');
  });

  it('goes back when tabbing away from the attendee back button', () => {
    const onNavigate = vi.fn();
    render(<SongSelection mode="attendee" onNavigate={onNavigate} />);

    const backButton = screen.getByRole('button', { name: /back/i });

    fireEvent.keyDown(backButton, { key: 'Tab' });

    expect(onNavigate).toHaveBeenCalledWith('attendee-dashboard');
  });

  it('lets DJs approve a pending song with the keyboard swipe fallback', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: 'event-1' }));
    getPendingSongsMock.mockResolvedValue([
      {
        _id: 'song-1',
        title: 'Test song',
        artist: 'Test artist',
        voteScore: 0,
        status: 'pending',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: 'event-1',
      },
    ]);
    approveSongMock.mockResolvedValue(undefined);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    const songCard = await screen.findByRole('button', {
      name: /decide test song\. swipe right to approve or left to reject\./i,
    });

    fireEvent.keyDown(songCard, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(approveSongMock).toHaveBeenCalledWith('event-1', 'song-1');
    });
  });
});
