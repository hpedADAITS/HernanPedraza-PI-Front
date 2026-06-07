import { useCallback, useRef, useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/useToast';
import { songsAPI } from '@/services/api';
import { t } from '@/i18n';
import type { Song } from '@/types/songs';

type SuggestionSuccess = () => void;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function useSongSuggestionForm(
  eventId: string | null,
  participantId: string | null,
  onSuccess: SuggestionSuccess,
) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [pendingMatch, setPendingMatch] = useState<Song['recognitionMatch']>(null);
  const [pendingMatches, setPendingMatches] = useState<Song['recognitionMatch'][]>([]);
  const [checkingMusicBrainz, setCheckingMusicBrainz] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const lookupInFlight = useRef(false);

  const submitSong = useCallback(
    async (options?: {
      musicBrainzConfirmed?: boolean;
      musicBrainzMatch?: Song['recognitionMatch'];
      skipMusicBrainzLookup?: boolean;
    }) => {
      if (!eventId || !participantId || !title.trim() || !artist.trim()) return;
      setSubmitting(true);
      try {
        const song = await songsAPI.suggestSong(
          eventId,
          participantId,
          title.trim(),
          artist.trim(),
          undefined,
          options,
        );
        toast.success(t('"{title}" suggested', { title: song.title }));
        setPendingMatch(null);
        setPendingMatches([]);
        onSuccess();
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to suggest song')));
      } finally {
        setSubmitting(false);
      }
    },
    [artist, eventId, onSuccess, participantId, title, toast],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!eventId || !participantId || !title.trim() || !artist.trim()) return;
      if (lookupInFlight.current || checkingMusicBrainz || submitting) return;

      lookupInFlight.current = true;
      setCheckingMusicBrainz(true);
      try {
        const matches = await songsAPI.lookupMusicBrainz(
          eventId,
          participantId,
          title.trim(),
          artist.trim(),
        );
        if (matches.length) {
          setPendingMatches(matches);
          setPendingMatch(matches[0]);
          return;
        }
        await submitSong({ skipMusicBrainzLookup: true });
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to suggest song')));
      } finally {
        lookupInFlight.current = false;
        setCheckingMusicBrainz(false);
      }
    },
    [artist, checkingMusicBrainz, eventId, participantId, submitSong, submitting, title, toast],
  );

  const confirmMusicBrainzMatch = useCallback(
    () => submitSong({
      musicBrainzConfirmed: true,
      musicBrainzMatch: pendingMatch,
      skipMusicBrainzLookup: true,
    }),
    [pendingMatch, submitSong],
  );

  const declineMusicBrainzMatch = useCallback(
    () => submitSong({ skipMusicBrainzLookup: true }),
    [submitSong],
  );

  return {
    artist,
    checkingMusicBrainz,
    confirmMusicBrainzMatch,
    declineMusicBrainzMatch,
    handleSubmit,
    pendingMatch,
    pendingMatches,
    selectMusicBrainzMatch: setPendingMatch,
    setArtist: (value: string) => {
      setPendingMatch(null);
      setPendingMatches([]);
      setArtist(value);
    },
    setTitle: (value: string) => {
      setPendingMatch(null);
      setPendingMatches([]);
      setTitle(value);
    },
    submitting,
    title,
  } as const;
}
