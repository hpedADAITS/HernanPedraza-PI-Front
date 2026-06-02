import { useCallback, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { songsAPI } from '@/services/api';
import { t } from '@/i18n';

type SuggestionSuccess = () => void;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback;
}

export function useSongSuggestionForm(
  eventId: string | null,
  participantId: string | null,
  onSuccess: SuggestionSuccess,
) {
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!eventId || !participantId || !title.trim() || !artist.trim()) return;

      setSubmitting(true);
      try {
        const song = await songsAPI.suggestSong(
          eventId,
          participantId,
          title.trim(),
          artist.trim(),
        );
        toast.success(t('"{title}" suggested', { title: song.title }));
        onSuccess();
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to suggest song')));
      } finally {
        setSubmitting(false);
      }
    },
    [artist, eventId, onSuccess, participantId, title],
  );

  return {
    artist,
    handleSubmit,
    setArtist,
    setTitle,
    submitting,
    title,
  } as const;
}
