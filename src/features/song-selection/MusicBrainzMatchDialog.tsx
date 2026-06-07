import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { t } from '@/i18n';
import type { AudioTrack } from '@/services/api/audioTracks';
import type { SongSelectionSong } from '@/features/song-selection/DjSongCard';
import { RecognitionCoverflow, type CoverflowItem } from './RecognitionCoverflow';

interface MusicBrainzMatchDialogProps {
  candidates: AudioTrack[];
  isLoading: boolean;
  isProcessing: boolean;
  onAssign: (trackId: string) => Promise<void>;
  onClose: () => void;
  song: SongSelectionSong | null;
}

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
              ) : (
                <RecognitionCoverflow
                  items={items}
                  isProcessing={isProcessing}
                  onSelect={(item) => {
                    if (item.type === 'track') {
                      setIndex(items.findIndex((i) => i.id === item.id));
                    }
                  }}
                />
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
                {t('Assign metadata')}
              </button>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
