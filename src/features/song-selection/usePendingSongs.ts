import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { songsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { listenDebugSongEvents } from '@/utils/debugSongEvents';
import { t } from '@/i18n';
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
  recognitionMatch?: PendingSong['recognitionMatch'];
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
  const pendingSongIdsRef = useRef<Set<string> | null>(null);
  if (pendingSongIdsRef.current === null) pendingSongIdsRef.current = new Set<string>();
  const [reviewSongIds, setReviewSongIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingSongId, setProcessingSongId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const setSyncedPendingSongs = useCallback(
    (updater: PendingSong[] | ((current: PendingSong[]) => PendingSong[])) => {
      setPendingSongs((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        pendingSongIdsRef.current = new Set(next.map((song) => song._id));
        return next;
      });
    },
    [],
  );

  const syncSuggestedSong = useCallback(
    (payload: SongEventPayload | DebugSongPayload) => {
      const songId = getSongId(payload);
      if (!songId || pendingSongIdsRef.current.has(songId)) return;

      const song = {
        _id: songId,
        title: payload.title || 'Untitled song',
        artist: payload.artist || 'Unknown artist',
        voteScore: payload.voteScore || 0,
        status: payload.status || 'PENDING',
        requestedBy: payload.requestedBy || null,
        recognitionMatch: payload.recognitionMatch || null,
        eventId: payload.eventId || eventId || '',
      };

      setSyncedPendingSongs((current) => [...current, song]);
      setReviewSongIds((current) => current.includes(songId) ? current : [...current, songId]);
    },
    [eventId, setSyncedPendingSongs],
  );

  const removePendingSong = useCallback(
    (payload: SongEventPayload | DebugSongPayload) => {
      const songId = getSongId(payload);
      if (!songId) return;
      setSyncedPendingSongs((current) => current.filter((song) => song._id !== songId));
      setReviewSongIds((current) => current.filter((id) => id !== songId));
    },
    [setSyncedPendingSongs],
  );

  const fetchPendingSongs = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      setSyncedPendingSongs(await songsAPI.getPendingSongs(eventId));
    } catch (error) {
      toast.error(getErrorMessage(error, t('Failed to load pending songs')));
    } finally {
      setLoading(false);
    }
  }, [eventId, setSyncedPendingSongs]);

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

  const reviewSong = useMemo(
    () => pendingSongs.find((song) => song._id === reviewSongIds[0]) || null,
    [pendingSongs, reviewSongIds],
  );

  const closeReviewSong = useCallback(() => {
    setReviewSongIds((current) => current.slice(1));
  }, []);

  const handleApprove = useCallback(
    async (songId: string) => {
      if (!eventId) return false;
      setProcessingSongId(songId);
      try {
        await songsAPI.approveSong(eventId, songId);
        setSyncedPendingSongs((current) => current.filter((song) => song._id !== songId));
        setReviewSongIds((current) => current.filter((id) => id !== songId));
        toast.success(t('Song approved'));
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to approve song')));
        return false;
      } finally {
        setProcessingSongId(null);
      }
    },
    [eventId, setSyncedPendingSongs],
  );

  const handleReject = useCallback(
    async (songId: string) => {
      if (!eventId) return false;
      setProcessingSongId(songId);
      try {
        await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
        setSyncedPendingSongs((current) => current.filter((song) => song._id !== songId));
        setReviewSongIds((current) => current.filter((id) => id !== songId));
        toast.success(t('Song rejected'));
        return true;
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to reject song')));
        return false;
      } finally {
        setProcessingSongId(null);
      }
    },
    [eventId, setSyncedPendingSongs],
  );

  return {
    filteredSongs,
    closeReviewSong,
    handleApprove,
    handleReject,
    loading,
    processingSongId,
    reviewSong,
    searchTerm,
    setSearchTerm,
  } as const;
}
