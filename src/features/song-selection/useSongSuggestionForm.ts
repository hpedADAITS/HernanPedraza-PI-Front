import { useCallback, useState, type FormEvent } from 'react';
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
  const [checkingMusicBrainz, setCheckingMusicBrainz] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      setCheckingMusicBrainz(true);
      try {
        const match = await songsAPI.lookupMusicBrainz(
          eventId,
          participantId,
          title.trim(),
          artist.trim(),
        );
        if (match) {
          setPendingMatch(match);
          return;
        }
        await submitSong({ skipMusicBrainzLookup: true });
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to suggest song')));
      } finally {
        setCheckingMusicBrainz(false);
      }
    },
    [artist, eventId, participantId, submitSong, title, toast],
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
    setArtist: (value: string) => {
      setPendingMatch(null);
      setArtist(value);
    },
    setTitle: (value: string) => {
      setPendingMatch(null);
      setTitle(value);
    },
    submitting,
    title,
  } as const;
}
