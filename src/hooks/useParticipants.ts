import { useState, useCallback } from 'react';
import { participantsAPI } from '@/services/api';

interface Participant {
  id: string;
  nickname: string;
  joinedAt: string;
  isPremium?: boolean;
}

export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentParticipant, setCurrentParticipant] =
    useState<Participant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinEvent = useCallback(async (eventId: string, nickname: string) => {
    setLoading(true);
    setError(null);
    try {
      const participant = await participantsAPI.joinEvent(eventId, nickname);
      setCurrentParticipant(participant);
      return participant;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to join event';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const leaveEvent = useCallback(async (participantId: string) => {
    setLoading(true);
    setError(null);
    try {
      const participant = await participantsAPI.leaveEvent(participantId);
      setCurrentParticipant(null);
      return participant;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to leave event';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const listParticipants = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await participantsAPI.listEventParticipants(eventId);
      setParticipants(list);
      return list;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load participants';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const setPremium = useCallback(
    async (participantId: string, isPremium: boolean) => {
      setLoading(true);
      setError(null);
      try {
        const participant = await participantsAPI.setPremium(
          participantId,
          isPremium,
        );
        return participant;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to set premium';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const setCooldown = useCallback(
    async (participantId: string, durationMs: number, reason: string) => {
      setLoading(true);
      setError(null);
      try {
        const participant = await participantsAPI.setCooldown(
          participantId,
          durationMs,
          reason,
        );
        return participant;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to set cooldown';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    participants,
    currentParticipant,
    loading,
    error,
    joinEvent,
    leaveEvent,
    listParticipants,
    setPremium,
    setCooldown,
  };
}
