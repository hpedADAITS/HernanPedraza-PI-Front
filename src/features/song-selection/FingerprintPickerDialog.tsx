import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Library, Link2, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';
import { audioTracksAPI } from '@/services/api/audioTracks';
import { songsAPI } from '@/services/api/songs';
import type { SongSelectionSong } from '@/features/song-selection/DjSongCard';

interface FingerprintPickerDialogProps {
  song: SongSelectionSong | null;
  eventId: string | null;
  onClose: () => void;
  onAssigned: () => void;
}

type CoverflowItem = {
  type: 'track';
  id: string;
  title: string;
  artist: string;
  coverUrl?: string | null;
  detail: string;
  track: { id: string; title: string; artist: string; coverUrl?: string | null };
};

function similarity(a: string, b: string) {
  const aTokens = new Set(a.toLowerCase().split(' '));
  const bTokens = new Set(b.toLowerCase().split(' '));
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  return aTokens.size + bTokens.size > 0 ? (2 * overlap) / (aTokens.size + bTokens.size) : 0;
}

export function FingerprintPickerDialog({
  song,
  eventId,
  onClose,
  onAssigned,
}: FingerprintPickerDialogProps) {
  const { error: toastError, success: toastSuccess } = useToast();

  if (!song) return null;
  const [tracks, setTracks] = useState<Array<{ id: string; title: string; artist: string; coverUrl?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!eventId) return;
    void (async () => {
      try {
        const data = await audioTracksAPI.listTracks(eventId);
        setTracks(data);
      } catch {
        toastError(t('Failed to load fingerprints'));
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, onClose, toastError]);

  const items = useMemo<CoverflowItem[]>(() => {
    const targetTitle = song.title;
    const targetArtist = song.artist;
    return tracks.map((track) => {
      const score = Number((
        similarity(targetTitle, track.title) * 0.65 +
        similarity(targetArtist, track.artist) * 0.35
      ).toFixed(3));
      return {
        type: 'track' as const,
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        detail: `${Math.round(score * 100)}% text match`,
        track,
      };
    });
  }, [tracks, song.title, song.artist]);

  useEffect(() => setIndex(0), [song._id]);

  const selected = items[index] || null;
  const move = (offset: number) => {
    if (!items.length) return;
    setIndex((current) => (current + offset + items.length) % items.length);
  };

  const handleAssign = async () => {
    if (!selected || !eventId) return;
    setProcessing(true);
    try {
      await songsAPI.assignFingerprint(eventId, song._id, selected.id);
      toastSuccess(t('Fingerprint assigned'));
      onAssigned();
      onClose();
    } catch (err) {
      toastError(err instanceof Error ? err.message : t('Failed to assign fingerprint'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {song ? (
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
            aria-label={t('Match fingerprint')}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-900/10 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-normal text-sky-600">
                  {t('Fingerprint library')}
                </p>
                <h2 className="mt-1 truncate text-xl font-black tracking-normal text-slate-950">
                  {song.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('Close')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5">
              {loading ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                  {t('Loading…')}
                </p>
              ) : items.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                  <Library size={44} className="mb-3 text-amber-400" aria-hidden="true" />
                  <p className="text-sm font-bold text-amber-900">
                    {t('No fingerprints yet. Upload a track to start.')}
                  </p>
                </div>
              ) : selected ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      disabled={items.length < 2 || processing}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('Previous')}
                    >
                      <ArrowLeft size={19} aria-hidden="true" />
                    </button>
                    <p className="text-xs font-black uppercase tracking-normal text-slate-400">
                      {index + 1} / {items.length}
                    </p>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      disabled={items.length < 2 || processing}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('Next')}
                    >
                      <ArrowRight size={19} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mx-auto flex min-h-[250px] max-w-sm flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-inner">
                    <div className="mb-4 grid h-32 w-32 place-items-center overflow-hidden rounded-2xl bg-emerald-100 text-emerald-700">
                      {selected.coverUrl ? (
                        <img src={selected.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Link2 size={42} aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-normal text-slate-400">
                      {t('DJ fingerprint')}
                    </p>
                    <h3 className="mt-1 max-w-full truncate text-lg font-black text-slate-950">
                      {selected.title}
                    </h3>
                    <p className="max-w-full truncate text-sm font-bold text-slate-500">
                      {selected.artist}
                    </p>
                    <p className="mt-2 max-w-full truncate text-xs font-semibold text-slate-400">
                      {selected.detail}
                    </p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={processing}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={processing || !selected}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2878ff] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(40,120,255,0.25)] transition-colors hover:bg-[#1f66dc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Assign fingerprint')}
              </button>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
