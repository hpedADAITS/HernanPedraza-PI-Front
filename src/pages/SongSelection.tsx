import { useCallback, useState, type KeyboardEvent } from 'react';
import { Layout } from '@/components/layout/Layout';
import { m } from 'motion/react';
import { ArrowLeft, ListPlus, Search } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDarkMode } from '@/hooks/useDarkMode';
import { getStoredEventId, getStoredParticipantId } from '@/services/session';
import type { NavigateToView } from '@/types';
import { AttendeeSongSuggestView } from '@/features/song-selection/AttendeeSongSuggestView';
import { DjSongCard } from '@/features/song-selection/DjSongCard';
import { RecognitionTrackUploadDialog } from '@/features/song-selection/RecognitionTrackUploadDialog';
import { usePendingSongs } from '@/features/song-selection/usePendingSongs';
import { useSongSuggestionForm } from '@/features/song-selection/useSongSuggestionForm';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';
  const [isDarkMode] = useDarkMode();
  const eventId = getStoredEventId();
  const participantId = getStoredParticipantId();
  const [recognitionUploadOpen, setRecognitionUploadOpen] = useState(false);
  const navigateBack = useCallback(() => {
    onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard');
  }, [isDj, onNavigate]);

  const {
    filteredSongs,
    handleApprove,
    handleReject,
    loading,
    processingSongId,
    searchTerm,
    setSearchTerm,
  } = usePendingSongs(eventId, isDj);

  const {
    artist,
    handleSubmit,
    setArtist,
    setTitle,
    submitting,
    title,
  } = useSongSuggestionForm(eventId, participantId, () => onNavigate('attendee-dashboard'));

  const handleBackKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (mode !== 'attendee' || e.key !== 'Tab') return;

    e.preventDefault();
    navigateBack();
  };

  return (
    <Layout theme={theme} className="px-5 py-6 md:px-10 md:py-8" showNav={true}>
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="absolute left-0 top-0 z-20">
          <m.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={navigateBack}
            onKeyDown={handleBackKeyDown}
            className="flex h-11 items-center gap-2 rounded-full border border-white/55 bg-white/16 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur-md transition-colors hover:bg-white/24"
          >
            <ArrowLeft size={18} />
            Back
          </m.button>
        </div>

        <div className="mb-8 flex min-h-11 items-center justify-center px-24 md:mb-10">
          <m.h1
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center text-2xl font-semibold tracking-normal text-white drop-shadow-sm md:text-4xl"
          >
            {isDj ? 'Pending Requests' : 'Suggest a Song'}
          </m.h1>
        </div>

        {isDj ? (
          <>
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
                  aria-label="Search pending songs"
                  placeholder="Search pending songs..."
                  className="h-full min-w-0 flex-1 cursor-text border-0 bg-transparent text-sm font-semibold tracking-normal text-[#14213f] outline-none placeholder:text-[#8b9ab4]"
                />
              </m.label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <m.button
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setRecognitionUploadOpen(true)}
                      className="grid h-[52px] w-[52px] flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-[#2878ff] shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-blue-50"
                      aria-label="Upload recognition track"
                    >
                      <ListPlus size={22} />
                    </m.button>
                  </TooltipTrigger>
                  <TooltipContent>Upload recognition track</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <RecognitionTrackUploadDialog
              eventId={eventId}
              open={recognitionUploadOpen}
              onClose={() => setRecognitionUploadOpen(false)}
            />

            {loading ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                Loading…
              </p>
            ) : filteredSongs.length === 0 ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                No pending songs
              </p>
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
                {filteredSongs.map((song) => (
                  <DjSongCard
                    key={song._id}
                    isProcessing={processingSongId === song._id}
                    onApprove={() => handleApprove(song._id)}
                    onReject={() => handleReject(song._id)}
                    song={song}
                  />
                ))}
              </m.div>
            )}
          </>
        ) : (
          <AttendeeSongSuggestView
            artist={artist}
            isDarkMode={isDarkMode}
            onArtistChange={setArtist}
            onSubmit={handleSubmit}
            onTitleChange={setTitle}
            submitting={submitting}
            title={title}
          />
        )}
      </div>
    </Layout>
  );
}
