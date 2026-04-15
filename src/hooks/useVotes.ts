import { useState, useCallback } from 'react';
import { votesAPI } from '@/services/api';

export function useVotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const castVote = useCallback(
    async (songId: string, participantId: string, value: number) => {
      setLoading(true);
      setError(null);
      try {
        const vote = await votesAPI.castVote(songId, participantId, value);
        return vote;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to cast vote';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const removeVote = useCallback(
    async (songId: string, participantId: string) => {
      setLoading(true);
      setError(null);
      try {
        const result = await votesAPI.removeVote(songId, participantId);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to remove vote';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const getVoteStats = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const stats = await votesAPI.getVoteStats(eventId);
      return stats;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load vote stats';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    castVote,
    removeVote,
    getVoteStats,
  };
}
