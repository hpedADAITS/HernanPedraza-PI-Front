import { useState, useCallback } from 'react';
import { songsAPI } from '@/services/api';
import type { Song } from '@/types/songs';

export function useSongs() {
  const [queue, setQueue] = useState<Song[]>([]);
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggestSong = useCallback(
    async (
      eventId: string,
      participantId: string,
      title: string,
      artist: string,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const song = await songsAPI.suggestSong(
          eventId,
          participantId,
          title,
          artist,
        );
        return song;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to suggest song';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getQueue = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const songs = await songsAPI.getQueue(eventId);
      setQueue(songs);
      return songs;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load queue';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPendingSongs = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const songs = await songsAPI.getPendingSongs(eventId);
      setPendingSongs(songs);
      return songs;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load pending songs';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveSong = useCallback(async (eventId: string, songId: string) => {
    setLoading(true);
    setError(null);
    try {
      const song = await songsAPI.approveSong(eventId, songId);
      /* Update pending list */
      setPendingSongs((prev) => prev.filter((s) => s._id !== songId));
      return song;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to approve song';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendNow = useCallback(async (eventId: string, songId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await songsAPI.sendNow(eventId, songId);
      setPendingSongs((prev) => prev.filter((s) => s._id !== songId));
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to send song now';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectSong = useCallback(
    async (eventId: string, songId: string, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        const song = await songsAPI.rejectSong(eventId, songId, reason);
        setPendingSongs((prev) => prev.filter((s) => s._id !== songId));
        return song;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to reject song';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getSongPosition = useCallback(
    async (eventId: string, songId: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await songsAPI.getSongPosition(eventId, songId);
        return data;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to get song position';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    queue,
    pendingSongs,
    loading,
    error,
    suggestSong,
    getQueue,
    getPendingSongs,
    approveSong,
    sendNow,
    rejectSong,
    getSongPosition,
  };
}
