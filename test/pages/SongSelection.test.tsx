import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SongSelection } from '@/pages/SongSelection';
import { NowPlaying } from '@/components/common/NowPlaying';

const {
  getPendingSongsMock,
  approveSongMock,
  lookupMusicBrainzMock,
  rejectSongMock,
  searchFingerprintsMock,
  suggestSongMock,
  socketOffMock,
  onSongSuggestedMock,
  onSongApprovedMock,
  onSongRejectedMock,
  socketOnMock,
} = vi.hoisted(() => ({
  getPendingSongsMock: vi.fn(),
  approveSongMock: vi.fn(),
  lookupMusicBrainzMock: vi.fn(),
  rejectSongMock: vi.fn(),
  searchFingerprintsMock: vi.fn(),
  suggestSongMock: vi.fn(),
  socketOffMock: vi.fn(),
  onSongSuggestedMock: vi.fn(),
  onSongApprovedMock: vi.fn(),
  onSongRejectedMock: vi.fn(),
  socketOnMock: vi.fn(),
}));

vi.mock('@/services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/api')>();

  return {
    ...actual,
    songsAPI: {
      ...actual.songsAPI,
      getPendingSongs: getPendingSongsMock,
      approveSong: approveSongMock,
      lookupMusicBrainz: lookupMusicBrainzMock,
      rejectSong: rejectSongMock,
      searchFingerprints: searchFingerprintsMock,
      suggestSong: suggestSongMock,
    },
  };
});

vi.mock('@/services/socket', () => ({
  off: socketOffMock,
  on: socketOnMock,
  onSongSuggested: onSongSuggestedMock,
  onSongApproved: onSongApprovedMock,
  onSongRejected: onSongRejectedMock,
}));

const DJ_EVENT_ID = '64b000000000000000000010';

describe('SongSelection attendee request form', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    lookupMusicBrainzMock.mockResolvedValue([]);
    searchFingerprintsMock.mockResolvedValue({ matches: [] });
    suggestSongMock.mockResolvedValue({
      _id: 'song-1',
      title: 'Suggested Song',
      artist: 'Suggested Artist',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('goes back when pressing Escape key', () => {
    const onNavigate = vi.fn();
    render(<SongSelection mode="attendee" onNavigate={onNavigate} />);

    fireEvent.keyDown(screen.getByRole('button', { name: /back/i }), { key: 'Escape' });

    expect(onNavigate).toHaveBeenCalledWith('attendee-dashboard');
  });

  it('submits the selected DJ library fingerprint with DJ metadata', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ _id: '64b000000000000000000001' }));
    localStorage.setItem('currentParticipant', JSON.stringify({ _id: '64b000000000000000000002' }));
    searchFingerprintsMock.mockResolvedValue({
      matches: [
        {
          trackId: '64b000000000000000000003',
          title: 'Canonical Library Title',
          artist: 'Canonical Library Artist',
          coverUrl: null,
          duration: 222,
          matchScore: 0.94,
          titleScore: 0.9,
          artistScore: 0.98,
          matchedOn: 'title_artist',
        },
      ],
    });

    render(<SongSelection mode="attendee" onNavigate={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('Song title') as HTMLInputElement;
    const artistInput = screen.getByPlaceholderText('Artist') as HTMLInputElement;

    fireEvent.change(titleInput, { target: { value: 'Attendee Typo Title' } });
    fireEvent.change(artistInput, { target: { value: 'Attendee Typo Artist' } });

    const matchButton = await screen.findByRole('button', {
      name: /canonical library title/i,
    });
    fireEvent.click(matchButton);

    expect(titleInput.value).toBe('Attendee Typo Title');
    expect(artistInput.value).toBe('Attendee Typo Artist');

    fireEvent.click(screen.getByRole('button', { name: 'Suggest Song' }));

    await waitFor(() => {
      expect(suggestSongMock).toHaveBeenCalledWith(
        '64b000000000000000000001',
        '64b000000000000000000002',
        'Canonical Library Title',
        'Canonical Library Artist',
        222,
        expect.objectContaining({
          fingerprintTrackId: '64b000000000000000000003',
          skipMusicBrainzLookup: true,
        }),
      );
    });
    expect(lookupMusicBrainzMock).not.toHaveBeenCalled();
  });

  it('lets DJs approve a pending song with the keyboard swipe fallback', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([
      {
        _id: 'song-1',
        title: 'Test song',
        artist: 'Test artist',
        voteScore: 0,
        status: 'pending',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      },
    ]);
    approveSongMock.mockResolvedValue(undefined);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    const songCard = await screen.findByRole('button', {
      name: /decide test song\. swipe right to approve or left to reject\./i,
    });

    fireEvent.keyDown(songCard, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(approveSongMock).toHaveBeenCalledWith(DJ_EVENT_ID, 'song-1');
    });
  });

  it('shows fingerprint matches on DJ pending song cards', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([
      {
        _id: 'song-1',
        title: 'Midnight Cty',
        artist: 'M83',
        voteScore: 0,
        status: 'pending',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        recognitionMatch: {
          trackId: 'track-1',
          title: 'Midnight City',
          artist: 'M83',
          coverUrl: 'https://example.com/cover.jpg',
          score: 0.93,
          matchedOn: 'title_artist',
        },
        eventId: DJ_EVENT_ID,
      },
    ]);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    expect(await screen.findAllByText('Fingerprint match 93%')).toHaveLength(2);
    expect(screen.getAllByText('Midnight City')).toHaveLength(2);
  });

  it('opens a review modal for a new realtime attendee request with no DB match', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([]);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => expect(onSongSuggestedMock).toHaveBeenCalled());
    act(() => {
      onSongSuggestedMock.mock.calls[0][0]({
        songId: 'song-1',
        title: 'Unknown request',
        artist: 'Local artist',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      });
    });

    const dialog = await screen.findByRole('dialog', {
      name: /review request unknown request/i,
    });

    expect(within(dialog).getByText('Unknown request')).toBeInTheDocument();
    expect(within(dialog).getByText('Local artist')).toBeInTheDocument();
    expect(within(dialog).getByText('Taylor')).toBeInTheDocument();
    expect(within(dialog).getByText('No DB fingerprint match found.')).toBeInTheDocument();
  });

  it('shows DB fingerprint match details in the realtime request modal', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([]);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => expect(onSongSuggestedMock).toHaveBeenCalled());
    act(() => {
      onSongSuggestedMock.mock.calls[0][0]({
        songId: 'song-1',
        title: 'Midnight Cty',
        artist: 'M83',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        recognitionMatch: {
          trackId: 'track-1',
          title: 'Midnight City',
          artist: 'M83',
          score: 0.93,
          matchedOn: 'title_artist',
        },
        eventId: DJ_EVENT_ID,
      });
    });

    const dialog = await screen.findByRole('dialog', {
      name: /review request midnight cty/i,
    });

    expect(within(dialog).getByText('DB fingerprint match 93%')).toBeInTheDocument();
    expect(within(dialog).getByText('Midnight City')).toBeInTheDocument();
    expect(within(dialog).getAllByText('M83').length).toBeGreaterThan(0);
  });

  it('closes the realtime request modal without removing the pending song', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([]);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => expect(onSongSuggestedMock).toHaveBeenCalled());
    act(() => {
      onSongSuggestedMock.mock.calls[0][0]({
        songId: 'song-1',
        title: 'Keep pending',
        artist: 'Modal test',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Close request review' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /review request keep pending/i })).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', {
        name: /decide keep pending\. swipe right to approve or left to reject\./i,
      }),
    ).toBeInTheDocument();
  });

  it('approves a realtime request from the modal and removes it', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([]);
    approveSongMock.mockResolvedValue(undefined);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => expect(onSongSuggestedMock).toHaveBeenCalled());
    act(() => {
      onSongSuggestedMock.mock.calls[0][0]({
        songId: 'song-1',
        title: 'Approve me',
        artist: 'Modal test',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Approve to queue' }));

    await waitFor(() => {
      expect(approveSongMock).toHaveBeenCalledWith(DJ_EVENT_ID, 'song-1');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /review request approve me/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Approve me')).not.toBeInTheDocument();
  });

  it('denies a realtime request from the modal and removes it', async () => {
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([]);
    rejectSongMock.mockResolvedValue(undefined);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    await waitFor(() => expect(onSongSuggestedMock).toHaveBeenCalled());
    act(() => {
      onSongSuggestedMock.mock.calls[0][0]({
        songId: 'song-1',
        title: 'Deny me',
        artist: 'Modal test',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      });
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Deny' }));

    await waitFor(() => {
      expect(rejectSongMock).toHaveBeenCalledWith(DJ_EVENT_ID, 'song-1', 'Rejected by DJ');
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /review request deny me/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Deny me')).not.toBeInTheDocument();
  });

  it('explains queue playback when no song is playing', () => {
    render(<NowPlaying status="idle" />);

    expect(
      screen.getByText('Approve requests into the queue, then choose the next song to play'),
    ).toBeInTheDocument();
    expect(screen.getByText('Queue controls playback')).toBeInTheDocument();
  });

  it('lets DJs reject a held song by releasing on the left side of the viewport', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 900,
    });
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([
      {
        _id: 'song-1',
        title: 'Left side song',
        artist: 'Test artist',
        voteScore: 0,
        status: 'pending',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      },
    ]);
    rejectSongMock.mockResolvedValue(undefined);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    const songCard = await screen.findByRole('button', {
      name: /decide left side song\. swipe right to approve or left to reject\./i,
    });

    fireEvent.pointerDown(songCard, { clientX: 450, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(songCard, { clientX: 120, clientY: 206, pointerId: 1 });
    fireEvent.pointerUp(songCard, { clientX: 70, clientY: 206, pointerId: 1 });

    await waitFor(() => {
      expect(rejectSongMock).toHaveBeenCalledWith(
        DJ_EVENT_ID,
        'song-1',
        'Rejected by DJ',
      );
    });
  });

  it('keeps vertical scrolling from deciding a DJ song', async () => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 900,
    });
    localStorage.setItem('currentEvent', JSON.stringify({ eventId: DJ_EVENT_ID }));
    getPendingSongsMock.mockResolvedValue([
      {
        _id: 'song-1',
        title: 'Scroll song',
        artist: 'Test artist',
        voteScore: 0,
        status: 'pending',
        requestedBy: { _id: 'user-1', nickname: 'Taylor' },
        eventId: DJ_EVENT_ID,
      },
    ]);

    render(<SongSelection mode="dj" onNavigate={vi.fn()} />);

    const songCard = await screen.findByRole('button', {
      name: /decide scroll song\. swipe right to approve or left to reject\./i,
    });

    fireEvent.pointerDown(songCard, { clientX: 450, clientY: 200, pointerId: 1 });
    fireEvent.pointerMove(songCard, { clientX: 456, clientY: 270, pointerId: 1 });
    fireEvent.pointerUp(songCard, { clientX: 70, clientY: 270, pointerId: 1 });

    expect(approveSongMock).not.toHaveBeenCalled();
    expect(rejectSongMock).not.toHaveBeenCalled();
  });
});
