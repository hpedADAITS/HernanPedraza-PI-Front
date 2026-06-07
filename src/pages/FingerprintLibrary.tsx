import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Disc3, Library, Link2, Search, Trash2 } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';
import { getStoredEventId } from '@/services/session';
import { audioTracksAPI, type AudioTrack } from '@/services/api/audioTracks';
import { RecognitionCoverflow, type CoverflowItem } from '@/features/song-selection/RecognitionCoverflow';
import { RecognitionTrackUploadDialog } from '@/features/song-selection/RecognitionTrackUploadDialog';

interface EnrichedTrack extends AudioTrack {
  musicBrainz: { title: string; artist: string; coverUrl: string | null; metadataSha512: string | null } | null;
  songsAttached: number;
}

function CoverflowDialog({
  track,
  onClose,
  onDelete,
}: {
  track: EnrichedTrack;
  onClose: () => void;
  onDelete: () => void;
}) {
  const items: CoverflowItem[] = [
    ...(track.musicBrainz
      ? [
          {
            type: 'musicbrainz' as const,
            id: 'musicbrainz',
            title: track.musicBrainz.title,
            artist: track.musicBrainz.artist,
            coverUrl: track.musicBrainz.coverUrl,
            detail: track.musicBrainz.metadataSha512
              ? `SHA512 ${track.musicBrainz.metadataSha512.slice(0, 12)}`
              : 'MusicBrainz metadata',
          },
        ]
      : []),
    {
      type: 'track' as const,
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverUrl: track.coverUrl,
      detail: `${track.songsAttached} song${track.songsAttached !== 1 ? 's' : ''} attached`,
    },
  ];

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm"
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-label={track.title}
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-900/10 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-normal text-sky-600">
              {t('Fingerprint')}
            </p>
            <h2 className="mt-1 truncate text-xl font-black tracking-normal text-slate-950">
              {track.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-950"
            aria-label={t('Close')}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <RecognitionCoverflow items={items} />
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-600 shadow-sm transition-colors hover:bg-red-100"
          >
            <Trash2 size={17} aria-hidden="true" />
            {t('Delete fingerprint')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            {t('Close')}
          </button>
        </div>
      </m.div>
    </m.div>
  );
}

function TrackRow({
  track,
  onOpen,
  onDelete,
}: {
  track: EnrichedTrack;
  onOpen: (track: EnrichedTrack) => void;
  onDelete: (track: EnrichedTrack) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t('Delete fingerprint?'))) return;
    setDeleting(true);
    try {
      await onDelete(track);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50">
      <button
        type="button"
        onClick={() => onOpen(track)}
        className="grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-500"
      >
        {track.coverUrl ? (
          <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : track.musicBrainz?.coverUrl ? (
          <img src={track.musicBrainz.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Disc3 size={28} aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{track.title}</p>
        <p className="truncate text-xs font-medium text-slate-500">{track.artist}</p>
        <div className="mt-1 flex items-center gap-2">
          {track.musicBrainz ? (
            <span className="inline-flex items-center gap-1 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
              <Link2 size={10} aria-hidden="true" />
              MusicBrainz
            </span>
          ) : null}
          {track.songsAttached > 0 ? (
            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
              {track.songsAttached} song{track.songsAttached !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
              Orphan
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-transparent text-slate-400 opacity-0 transition-all group-hover:opacity-100 group-hover:border-slate-200 group-hover:bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={t('Delete fingerprint')}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export function FingerprintLibrary({ onNavigate }: { onNavigate: (view: 'dj-song-select') => void }) {
  const eventId = getStoredEventId();
  const [tracks, setTracks] = useState<EnrichedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrphan, setFilterOrphan] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTrack, setActiveTrack] = useState<EnrichedTrack | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    if (!eventId) return;
    try {
      const data = await audioTracksAPI.listTracks(eventId);
      setTracks(data as EnrichedTrack[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to load fingerprints'));
    } finally {
      setLoading(false);
    }
  }, [eventId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tracks.filter((t) => {
      if (filterOrphan && t.songsAttached > 0) return false;
      if (!q) return true;
      return t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q);
    });
  }, [tracks, search, filterOrphan]);

  const handleDelete = async (track: EnrichedTrack) => {
    if (!eventId) return;
    try {
      await audioTracksAPI.deleteTrack(eventId, track.id);
      setTracks((prev) => prev.filter((t) => t.id !== track.id));
      toast.success(t('Fingerprint deleted'));
      setActiveTrack(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('Failed to delete fingerprint'));
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-slate-50">
      <div className="flex items-center gap-4 border-b border-slate-200/60 bg-white/80 px-6 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => onNavigate('dj-song-select')}
          className="flex h-10 items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-colors hover:bg-white/80"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {t('Back')}
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-xl font-bold text-slate-900">{t('Fingerprints')}</h1>
          <p className="text-xs font-medium text-slate-500">
            {tracks.length} track{tracks.length !== 1 ? 's' : ''} indexed
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="flex h-10 items-center gap-2 rounded-full border border-slate-900/10 bg-[#2878ff] px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1f66dc]"
        >
          <Disc3 size={18} aria-hidden="true" />
          {t('Upload')}
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-6 py-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search fingerprints...')}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="button"
            onClick={() => setFilterOrphan((v) => !v)}
            className={clsx(
              'flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors',
              filterOrphan
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
            )}
          >
            {t('Orphans only')}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <p className="text-sm font-medium text-slate-500">{t('Loading…')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-center">
              <Library size={44} className="mb-3 text-slate-300" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-600">
                {tracks.length === 0
                  ? t('No fingerprints yet. Upload a track to start.')
                  : t('No fingerprints match your search.')}
              </p>
            </div>
          ) : (
            <m.div
              className="flex flex-col gap-2 pb-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.05 } },
              }}
            >
              {filtered.map((track) => (
                <m.div
                  key={track.id}
                  variants={{ hidden: { y: 8, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                >
                  <TrackRow
                    track={track}
                    onOpen={setActiveTrack}
                    onDelete={handleDelete}
                  />
                </m.div>
              ))}
            </m.div>
          )}
        </div>
      </div>

      <RecognitionTrackUploadDialog
        eventId={eventId}
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
      />

      <AnimatePresence>
        {activeTrack ? (
          <CoverflowDialog
            track={activeTrack}
            onClose={() => setActiveTrack(null)}
            onDelete={async () => {
              await handleDelete(activeTrack);
            }}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
