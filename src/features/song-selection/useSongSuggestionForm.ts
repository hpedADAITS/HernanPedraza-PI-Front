import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useToast } from '@/hooks/useToast';
import { songsAPI } from '@/services/api';
import { t } from '@/i18n';
import type { Song } from '@/types/songs';
import type { FingerprintSearchMatch } from './AttendeeSongSuggestView';

type SuggestionSuccess = () => void;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message || fallback : fallback;
}

const FINGERPRINT_DEBOUNCE_MS = 220;

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
  const [fingerprintMatches, setFingerprintMatches] = useState<FingerprintSearchMatch[]>([]);
  const [fingerprintSearchActive, setFingerprintSearchActive] = useState(false);
  const [selectedFingerprintTrackId, setSelectedFingerprintTrackId] = useState<string | null>(null);
  const [selectedFingerprintMatch, setSelectedFingerprintMatch] = useState<FingerprintSearchMatch | null>(null);
  const lookupInFlight = useRef(false);
  const fingerprintSeq = useRef(0);

  const submitSong = useCallback(
    async (options?: {
      fingerprintTrackId?: string | null;
      musicBrainzConfirmed?: boolean;
      musicBrainzMatch?: Song['recognitionMatch'];
      skipMusicBrainzLookup?: boolean;
    }) => {
      if (!eventId || !participantId) return;
      if (!selectedFingerprintMatch && (!title.trim() || !artist.trim())) return;
      setSubmitting(true);
      try {
        const submittedTitle = selectedFingerprintMatch?.title ?? title.trim();
        const submittedArtist = selectedFingerprintMatch?.artist ?? artist.trim();
        const submittedDuration =
          selectedFingerprintMatch?.duration ?? undefined;
        const song = await songsAPI.suggestSong(
          eventId,
          participantId,
          submittedTitle,
          submittedArtist,
          submittedDuration,
          selectedFingerprintMatch
            ? {
                fingerprintTrackId: selectedFingerprintMatch.trackId,
                skipMusicBrainzLookup: true,
              }
            : options,
        );
        toast.success(t('"{title}" suggested', { title: song.title }));
        setPendingMatch(null);
        setPendingMatches([]);
        setFingerprintMatches([]);
        setSelectedFingerprintMatch(null);
        setSelectedFingerprintTrackId(null);
        onSuccess();
      } catch (error) {
        toast.error(getErrorMessage(error, t('Failed to suggest song')));
      } finally {
        setSubmitting(false);
      }
    },
    [artist, eventId, onSuccess, participantId, selectedFingerprintMatch, title, toast],
  );

  // Debounced typeahead against the DJ fingerprinted library.
  useEffect(() => {
    if (!eventId || !participantId) {
      setFingerprintMatches([]);
      return;
    }
    const trimmedTitle = title.trim();
    const trimmedArtist = artist.trim();
    if (trimmedTitle.length < 1 && trimmedArtist.length < 1) {
      setFingerprintMatches([]);
      setFingerprintSearchActive(false);
      return;
    }
    const mySeq = ++fingerprintSeq.current;
    setFingerprintSearchActive(true);
    const handle = setTimeout(async () => {
      try {
        const result = await songsAPI.searchFingerprints(
          eventId,
          participantId,
          trimmedTitle,
          trimmedArtist,
        );
        if (mySeq !== fingerprintSeq.current) return;
        setFingerprintMatches(result.matches || []);
      } catch {
        if (mySeq !== fingerprintSeq.current) return;
        setFingerprintMatches([]);
      } finally {
        if (mySeq === fingerprintSeq.current) {
          setFingerprintSearchActive(false);
        }
      }
    }, FINGERPRINT_DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [artist, eventId, participantId, title]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (!eventId || !participantId) return;
      if (!selectedFingerprintMatch && (!title.trim() || !artist.trim())) return;
      if (lookupInFlight.current || checkingMusicBrainz || submitting) return;
      if (selectedFingerprintMatch) {
        await submitSong({ skipMusicBrainzLookup: true });
        return;
      }

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
    [artist, checkingMusicBrainz, eventId, participantId, selectedFingerprintMatch, submitSong, submitting, title, toast],
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

  const pickFingerprintMatch = useCallback(
    (match: FingerprintSearchMatch) => {
      setPendingMatch(null);
      setPendingMatches([]);
      setSelectedFingerprintMatch((current) =>
        current?.trackId === match.trackId ? null : match,
      );
      setSelectedFingerprintTrackId((current) =>
        current === match.trackId ? null : match.trackId,
      );
    },
    [],
  );

  const updateTitle = useCallback((value: string) => {
    setPendingMatch(null);
    setPendingMatches([]);
    setSelectedFingerprintMatch(null);
    setSelectedFingerprintTrackId(null);
    setTitle(value);
  }, []);

  const updateArtist = useCallback((value: string) => {
    setPendingMatch(null);
    setPendingMatches([]);
    setSelectedFingerprintMatch(null);
    setSelectedFingerprintTrackId(null);
    setArtist(value);
  }, []);

  return {
    artist,
    checkingMusicBrainz,
    confirmMusicBrainzMatch,
    declineMusicBrainzMatch,
    fingerprintMatches,
    fingerprintSearchActive,
    handleSubmit,
    pendingMatch,
    pendingMatches,
    pickFingerprintMatch,
    selectMusicBrainzMatch: setPendingMatch,
    selectedFingerprintMatch,
    selectedFingerprintTrackId,
    setArtist: updateArtist,
    setTitle: updateTitle,
    submitting,
    title,
  } as const;
}
