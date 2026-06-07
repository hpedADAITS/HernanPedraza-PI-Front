import { useCallback, useMemo, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { m } from 'motion/react';
import { ArrowLeft, ChevronDown, Library, ListPlus, Music, Search, Star, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDarkMode } from '@/hooks/useDarkMode';
import { getStoredEventId, getStoredParticipantId } from '@/services/session';
import type { NavigateToView } from '@/types';
import { AttendeeCooldownOverlay } from '@/components/dashboard/AttendeeCooldownOverlay';
import { DjRequestReviewDialog } from '@/features/song-selection/DjRequestReviewDialog';
import { AttendeeSongSuggestView } from '@/features/song-selection/AttendeeSongSuggestView';
import { DjSongCard, type SongSelectionSong } from '@/features/song-selection/DjSongCard';
import { FingerprintPickerDialog } from '@/features/song-selection/FingerprintPickerDialog';
import { MusicBrainzMatchDialog } from '@/features/song-selection/MusicBrainzMatchDialog';
import { RecognitionTrackUploadDialog } from '@/features/song-selection/RecognitionTrackUploadDialog';
import { usePendingSongs } from '@/features/song-selection/usePendingSongs';
import { useParticipantCooldown } from '@/hooks/useParticipantCooldown';
import { useSongSuggestionForm } from '@/features/song-selection/useSongSuggestionForm';
import { t } from '@/i18n';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { songsAPI } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import type { AudioTrack } from '@/services/api/audioTracks';

type SortFilter = 'all' | 'priority' | 'newest';

// Metrics card component - inspired by REQUESTS.html stats section
function MetricCard({
  label,
  value,
  sublabel,
  variant = 'blue',
}: {
  label: string;
  value: number;
  sublabel: string;
  variant?: 'blue' | 'gold' | 'green';
}) {
  const colors = {
    blue: 'bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600',
    gold: 'bg-gradient-to-br from-amber-50 to-yellow-50 text-amber-600',
    green: 'bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-600',
  };

  return (
    <div className="flex flex-1 items-center gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.08)]">
      <div className={`grid h-14 w-14 flex-shrink-0 place-items-center rounded-xl ${colors[variant]}`}>
        {variant === 'blue' && <Music size={26} />}
        {variant === 'gold' && <Star size={26} />}
        {variant === 'green' && <CheckCircle2 size={26} />}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900">{value}</p>
        <p className="text-xs font-medium text-slate-400">{sublabel}</p>
      </div>
    </div>
  );
}

// Filter button component - inspired by REQUESTS.html toolbar filters
function FilterButton({
  active,
  label,
  onClick,
  icon: Icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all ${
        active
          ? 'border-blue-500 bg-blue-600 text-white shadow-lg shadow-blue-500/25'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

// Empty state - inspired by REQUESTS.html empty-card section
function EmptyPendingState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300/50 bg-white/10 py-16 text-center">
      <div className="mb-6 grid h-24 w-24 place-items-center rounded-2xl bg-white/20">
        <Music size={44} className="text-white/60" />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-white">{t('No pending songs')}</h2>
      <p className="max-w-sm text-sm font-medium text-white/70">
        {t('New requests will appear here for review.')}
      </p>
    </div>
  );
}

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';
  const [isDarkMode] = useDarkMode();
  const toast = useToast();
  const eventId = getStoredEventId();
  const participantId = getStoredParticipantId();
  const { isCoolingDown, remainingMs } = useParticipantCooldown(participantId, !isDj);
  const [recognitionUploadOpen, setRecognitionUploadOpen] = useState(false);
  const [pickingFingerprintSong, setPickingFingerprintSong] = useState<SongSelectionSong | null>(null);
  const [metadataMatchSong, setMetadataMatchSong] = useState<SongSelectionSong | null>(null);
  const [metadataCandidates, setMetadataCandidates] = useState<AudioTrack[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [metadataProcessing, setMetadataProcessing] = useState(false);
  const [sortFilter, setSortFilter] = useState<SortFilter>('all');

  const navigateBack = useCallback(() => {
    onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard');
  }, [isDj, onNavigate]);

  const {
    closeReviewSong,
    filteredSongs,
    handleApprove,
    handleReject,
    loading,
    processingSongId,
    reviewSong,
    searchTerm,
    selectForReview,
    setSearchTerm,
  } = usePendingSongs(eventId, isDj);

  const {
    artist,
    checkingMusicBrainz,
    confirmMusicBrainzMatch,
    declineMusicBrainzMatch,
    handleSubmit,
    pendingMatch,
    pendingMatches,
    selectMusicBrainzMatch,
    setArtist,
    setTitle,
    submitting,
    title,
  } = useSongSuggestionForm(eventId, participantId, () => onNavigate('attendee-dashboard'));

  useEscapeKey(navigateBack);

  // Calculate metrics - pending count from filtered songs
  const metrics = useMemo(() => {
    const pending = filteredSongs.length;
    // Count priority requests (those with any requestedBy - indicates an attendee)
    const priority = filteredSongs.filter((s) => s.requestedBy).length;
    return { pending, priority };
  }, [filteredSongs]);

  // Track approved today (session-only, not persisted)
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);

  // Sort songs based on filter
  const sortedSongs = useMemo(() => {
    const songs = [...filteredSongs];
    switch (sortFilter) {
      case 'priority':
        // Sort by vote score descending
        return songs.sort((a, b) => (b.voteScore || 0) - (a.voteScore || 0));
      case 'newest':
        // Reverse to show newest first
        return songs.reverse();
      case 'all':
      default:
        return songs;
    }
  }, [filteredSongs, sortFilter]);

  // Wrap handleApprove to track approved count
  const handleApproveWithTracking = useCallback(
    async (songId: string) => {
      setApprovedTodayCount((prev) => prev + 1);
      await handleApprove(songId);
    },
    [handleApprove],
  );

  const activeFilter = sortFilter;

  const openMetadataMatch = useCallback(async (song: SongSelectionSong) => {
    if (!eventId) return;
    setMetadataMatchSong(song);
    setMetadataCandidates([]);
    setMetadataLoading(true);
    try {
      const data = await songsAPI.getMusicBrainzMatchCandidates(eventId, song._id);
      setMetadataCandidates(data.tracks);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to load metadata matches'));
      setMetadataMatchSong(null);
    } finally {
      setMetadataLoading(false);
    }
  }, [eventId, toast]);

  const assignMetadataTrack = useCallback(async (trackId: string) => {
    if (!eventId || !metadataMatchSong) return;
    setMetadataProcessing(true);
    try {
      await songsAPI.assignMusicBrainzTrack(eventId, metadataMatchSong._id, trackId);
      toast.success(t('Metadata assigned'));
      setMetadataMatchSong(null);
      setMetadataCandidates([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to assign metadata'));
    } finally {
      setMetadataProcessing(false);
    }
  }, [eventId, metadataMatchSong, toast]);

  return (
    <Layout theme={theme} className="px-5 py-6 md:px-10 md:py-8" showNav={true}>
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="absolute left-0 top-0 z-20">
          <m.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={navigateBack}
            className="flex h-11 items-center gap-2 rounded-full border border-white/55 bg-white/16 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur-md transition-colors hover:bg-white/24"
          >
            <ArrowLeft size={18} />
            {t('Back')}
          </m.button>
        </div>

        <div className="mb-8 flex min-h-11 items-center justify-center px-24 md:mb-10">
          <m.h1
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center text-2xl font-semibold tracking-normal text-white drop-shadow-sm md:text-4xl"
          >
            {isDj ? t('Pending Requests') : t('Suggest a Song')}
          </m.h1>
        </div>

        {isDj ? (
          <>
            {/* Metrics cards - inspired by REQUESTS.html stats section */}
            <div className="mb-6 grid grid-cols-3 gap-4 md:mb-8">
              <MetricCard
                label={t('Pending')}
                value={metrics.pending}
                sublabel={t('Awaiting review')}
                variant="blue"
              />
              <MetricCard
                label={t('Priority')}
                value={metrics.priority}
                sublabel={t('High priority')}
                variant="gold"
              />
              <MetricCard
                label={t('Approved Today')}
                value={approvedTodayCount}
                sublabel={t('Approved today')}
                variant="green"
              />
            </div>

            {/* Filter buttons - inspired by REQUESTS.html toolbar */}
            <div className="mb-6 flex flex-wrap gap-3 md:mb-8">
              <FilterButton
                active={activeFilter === 'all'}
                label={t('All')}
                onClick={() => setSortFilter('all')}
                icon={Music}
              />
              <FilterButton
                active={activeFilter === 'priority'}
                label={t('Priority')}
                onClick={() => setSortFilter('priority')}
                icon={Star}
              />
              <FilterButton
                active={activeFilter === 'newest'}
                label={t('Newest')}
                onClick={() => setSortFilter('newest')}
                icon={ChevronDown}
              />
            </div>

            {/* Search bar - styled matching REQUESTS.html design */}
            <div className="mx-auto mb-6 mt-2 flex w-full max-w-2xl items-center gap-3 md:mb-8 md:mt-4">
              <m.label
                layoutId="search-bar"
                className="group flex h-[52px] min-w-0 flex-1 cursor-text items-center gap-3.5 rounded-xl border border-slate-900/10 bg-white px-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]"
              >
                <Search
                  aria-hidden="true"
                  className="h-5 w-5 flex-shrink-0 text-[#526990] transition-colors group-hover:text-[#2878ff]"
                />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label={t('Search pending songs')}
                  placeholder={t('Search pending songs...')}
                  className="h-full min-w-0 flex-1 cursor-text border-0 bg-transparent text-sm font-semibold tracking-normal text-[#14213f] outline-none placeholder:text-[#8b9ab4]"
                />
              </m.label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <m.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { onNavigate('dj-fingerprints'); }}
                      className="grid h-[52px] w-[52px] flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-slate-50"
                      aria-label={t('Browse fingerprinted tracks')}
                    >
                      <Library size={22} />
                    </m.button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Browse fingerprinted tracks')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <m.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRecognitionUploadOpen(true)}
                      className="grid h-[52px] w-[52px] flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-[#2878ff] shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-blue-50"
                      aria-label={t('Upload recognition track')}
                    >
                      <ListPlus size={22} />
                    </m.button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Upload recognition track')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <RecognitionTrackUploadDialog
              eventId={eventId}
              open={recognitionUploadOpen}
              onClose={() => setRecognitionUploadOpen(false)}
            />
            <DjRequestReviewDialog
              isProcessing={!!reviewSong && processingSongId === reviewSong._id}
              onApprove={async () => {
                if (reviewSong) await handleApproveWithTracking(reviewSong._id);
              }}
              onClose={closeReviewSong}
              onNavigate={onNavigate}
              onReject={async () => {
                if (reviewSong) await handleReject(reviewSong._id);
              }}
              song={reviewSong}
            />
            <MusicBrainzMatchDialog
              candidates={metadataCandidates}
              isLoading={metadataLoading}
              isProcessing={metadataProcessing}
              onAssign={assignMetadataTrack}
              onClose={() => {
                if (!metadataProcessing) setMetadataMatchSong(null);
              }}
              song={metadataMatchSong}
            />
            <FingerprintPickerDialog
              song={pickingFingerprintSong}
              eventId={eventId}
              onClose={() => setPickingFingerprintSong(null)}
              onAssigned={() => {}}
            />

            {loading ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                {t('Loading…')}
              </p>
            ) : sortedSongs.length === 0 ? (
              <EmptyPendingState />
            ) : (
              <m.div
                className="flex w-full flex-col gap-3 pb-6"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 },
                  },
                }}
              >
                {sortedSongs.map((song) => (
                  <DjSongCard
                    key={song._id}
                    isProcessing={processingSongId === song._id}
                    onApprove={async () => {
                      await handleApproveWithTracking(song._id);
                    }}
                    onClick={() => selectForReview(song._id)}
                    onMatchMetadata={
                      song.recognitionMatch?.source === 'musicbrainz'
                        ? () => void openMetadataMatch(song)
                        : undefined
                    }
                    onPickFingerprint={
                      song.recognitionMatch?.source !== 'musicbrainz'
                        ? () => setPickingFingerprintSong(song)
                        : undefined
                    }
                    onReject={async () => {
                      await handleReject(song._id);
                    }}
                    song={song}
                  />
                ))}
              </m.div>
            )}
          </>
        ) : (
          <AttendeeSongSuggestView
            artist={artist}
            checkingMusicBrainz={checkingMusicBrainz}
            isDarkMode={isDarkMode}
            musicBrainzMatch={pendingMatch}
            musicBrainzMatches={pendingMatches}
            onArtistChange={setArtist}
            onConfirmMusicBrainzMatch={confirmMusicBrainzMatch}
            onDeclineMusicBrainzMatch={declineMusicBrainzMatch}
            onSelectMusicBrainzMatch={selectMusicBrainzMatch}
            onSubmit={handleSubmit}
            onTitleChange={setTitle}
            submitting={submitting}
            title={title}
          />
        )}
        {!isDj && isCoolingDown && <AttendeeCooldownOverlay remainingMs={remainingMs} />}
      </div>
    </Layout>
  );
}
