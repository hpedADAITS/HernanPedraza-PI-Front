import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { songsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import type { SongEventPayload } from '@/services/socket/contracts';
import type { SongSelectionSong } from '@/features/song-selection/DjSongCard';

type PendingSong = SongSelectionSong;

type DebugSongPayload = {
  songId?: string;
  _id?: string;
  id?: string;
  title?: string;
  artist?: string;
  voteScore?: number;
  status?: string;
  requestedBy?: PendingSong['requestedBy'];
  eventId?: string;
};

function getSongId(payload: Pick<DebugSongPayload, 'songId' | '_id' | 'id'>) {
  return payload.songId || payload._id || payload.id || null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function usePendingSongs(eventId: string | null, isDj: boolean) {
  const [pendingSongs, setPendingSongs] = useState<PendingSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingSongId, setProcessingSongId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const syncSuggestedSong = useCallback(
    (payload: SongEventPayload | DebugSongPayload) => {
      const songId = getSongId(payload);
      if (!songId) return;

      setPendingSongs((current) => {
        if (current.some((song) => song._id === songId)) {
          return current;
        }

        return [
          ...current,
          {
            _id: songId,
            title: payload.title || 'Untitled song',
            artist: payload.artist || 'Unknown artist',
            voteScore: payload.voteScore || 0,
            status: payload.status || 'PENDING',
            requestedBy: payload.requestedBy || null,
            eventId: payload.eventId || eventId || '',
          },
        ];
      });
    },
    [eventId],
  );

  const removePendingSong = useCallback(
    (payload: SongEventPayload | DebugSongPayload) => {
      const songId = getSongId(payload);
      if (!songId) return;
      setPendingSongs((current) => current.filter((song) => song._id !== songId));
    },
    [],
  );

  const fetchPendingSongs = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      setPendingSongs(await songsAPI.getPendingSongs(eventId));
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load pending songs'));
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isDj) {
      fetchPendingSongs();
    }
  }, [fetchPendingSongs, isDj]);

  useEffect(() => {
    if (!isDj) return undefined;

    try {
      socket.onSongSuggested(syncSuggestedSong);
      socket.onSongApproved(removePendingSong);
      socket.onSongRejected(removePendingSong);
    } catch {
      /* Socket not initialized yet */
    }

    const stopDebugEvents = listenDebugSongEvents(({ type, payload }) => {
      if (type === 'song_suggested') {
        syncSuggestedSong(payload as DebugSongPayload);
      }

      if (type === 'song_approved' || type === 'song_rejected') {
        removePendingSong(payload as DebugSongPayload);
      }
    });

    return () => {
      socket.off('song_suggested', syncSuggestedSong);
      socket.off('song_approved', removePendingSong);
      socket.off('song_rejected', removePendingSong);
      stopDebugEvents();
    };
  }, [isDj, removePendingSong, syncSuggestedSong]);

  const filteredSongs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return pendingSongs;

    return pendingSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(term) ||
        song.artist.toLowerCase().includes(term),
    );
  }, [pendingSongs, searchTerm]);

  const handleApprove = useCallback(
    async (songId: string) => {
      if (!eventId) return;
      setProcessingSongId(songId);
      try {
        await songsAPI.approveSong(eventId, songId);
        setPendingSongs((current) => current.filter((song) => song._id !== songId));
        toast.success('Song approved');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to approve song'));
      } finally {
        setProcessingSongId(null);
      }
    },
    [eventId],
  );

  const handleReject = useCallback(
    async (songId: string) => {
      if (!eventId) return;
      setProcessingSongId(songId);
      try {
        await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
        setPendingSongs((current) => current.filter((song) => song._id !== songId));
        toast.success('Song rejected');
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to reject song'));
      } finally {
        setProcessingSongId(null);
      }
    },
    [eventId],
  );

  return {
    filteredSongs,
    handleApprove,
    handleReject,
    loading,
    processingSongId,
    searchTerm,
    setSearchTerm,
  } as const;
}
