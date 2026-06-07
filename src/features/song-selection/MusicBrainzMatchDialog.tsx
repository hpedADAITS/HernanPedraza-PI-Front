import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Disc3, Link2, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { clsx } from 'clsx';
import { t } from '@/i18n';
import type { AudioTrack } from '@/services/api/audioTracks';
import type { SongSelectionSong } from '@/features/song-selection/DjSongCard';

interface MusicBrainzMatchDialogProps {
  candidates: AudioTrack[];
  isLoading: boolean;
  isProcessing: boolean;
  onAssign: (trackId: string) => Promise<void>;
  onClose: () => void;
  song: SongSelectionSong | null;
}

type CoverflowItem =
  | { type: 'musicbrainz'; id: 'musicbrainz'; title: string; artist: string; coverUrl?: string | null; detail: string }
  | { type: 'track'; id: string; title: string; artist: string; coverUrl?: string | null; detail: string };

export function MusicBrainzMatchDialog({
  candidates,
  isLoading,
  isProcessing,
  onAssign,
  onClose,
  song,
}: MusicBrainzMatchDialogProps) {
  const [index, setIndex] = useState(0);
  const match = song?.recognitionMatch;
  const items = useMemo<CoverflowItem[]>(() => {
    if (!match) return [];
    return [
      {
        type: 'musicbrainz',
        id: 'musicbrainz',
        title: match.title,
        artist: match.artist,
        coverUrl: match.coverUrl,
        detail: match.metadataSha512 ? `SHA512 ${match.metadataSha512.slice(0, 12)}` : 'MusicBrainz metadata',
      },
      ...candidates.map((track) => ({
        type: 'track' as const,
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverUrl: track.coverUrl,
        detail: `${Math.round((track.matchScore || 0) * 100)}% text match`,
      })),
    ];
  }, [candidates, match]);

  useEffect(() => setIndex(0), [song?._id]);

  const selected = items[index] || null;
  const move = (offset: number) => {
    if (!items.length) return;
    setIndex((current) => (current + offset + items.length) % items.length);
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
            aria-label={t('Match MusicBrainz metadata')}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-900/10 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-normal text-sky-600">
                  {t('MusicBrainz metadata')}
                </p>
                <h2 className="mt-1 truncate text-xl font-black tracking-normal text-slate-950">
                  {song.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('Close')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="p-5">
              {isLoading ? (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">
                  {t('Loading…')}
                </p>
              ) : selected ? (
                <>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      disabled={items.length < 2 || isProcessing}
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
                      disabled={items.length < 2 || isProcessing}
                      className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={t('Next')}
                    >
                      <ArrowRight size={19} aria-hidden="true" />
                    </button>
                  </div>

                  <div className="mx-auto flex min-h-[250px] max-w-sm flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-inner">
                    <div className={clsx(
                      'mb-4 grid h-32 w-32 place-items-center overflow-hidden rounded-2xl',
                      selected.type === 'musicbrainz' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700',
                    )}>
                      {selected.coverUrl ? (
                        <img src={selected.coverUrl} alt="" className="h-full w-full object-cover" />
                      ) : selected.type === 'musicbrainz' ? (
                        <Disc3 size={44} aria-hidden="true" />
                      ) : (
                        <Link2 size={42} aria-hidden="true" />
                      )}
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-normal text-slate-400">
                      {selected.type === 'musicbrainz' ? t('MusicBrainz data') : t('DJ fingerprint')}
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
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
                  {t('No fingerprinted tracks found.')}
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={() => selected?.type === 'track' && onAssign(selected.id)}
                disabled={isProcessing || selected?.type !== 'track'}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2878ff] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(40,120,255,0.25)] transition-colors hover:bg-[#1f66dc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check size={17} aria-hidden="true" />
                {t('Assign metadata')}
              </button>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
