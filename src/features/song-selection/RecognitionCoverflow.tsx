import { useState } from 'react';
import { ArrowLeft, ArrowRight, Disc3, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { t } from '@/i18n';

export type CoverflowItem =
  | { type: 'musicbrainz'; id: string; title: string; artist: string; coverUrl?: string | null; detail: string }
  | { type: 'track'; id: string; title: string; artist: string; coverUrl?: string | null; detail: string };

interface RecognitionCoverflowProps {
  items: CoverflowItem[];
  isProcessing?: boolean;
  onSelect?: (item: CoverflowItem) => void;
}

export function RecognitionCoverflow({ items, isProcessing = false, onSelect }: RecognitionCoverflowProps) {
  const [index, setIndex] = useState(0);

  const selected = items[index] || null;
  const move = (offset: number) => {
    if (!items.length) return;
    setIndex((current) => (current + offset + items.length) % items.length);
  };

  return (
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
          {items.length > 0 ? `${index + 1} / ${items.length}` : '0 / 0'}
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

      {selected ? (
        <button
          type="button"
          onClick={() => onSelect?.(selected)}
          disabled={isProcessing}
          className="mx-auto flex min-h-[250px] w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-inner transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <div
            className={clsx(
              'mb-4 grid h-32 w-32 place-items-center overflow-hidden rounded-2xl',
              selected.type === 'musicbrainz' ? 'bg-sky-100 text-sky-700' : 'bg-emerald-100 text-emerald-700',
            )}
          >
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
        </button>
      ) : (
        <div className="mx-auto flex min-h-[250px] w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-bold text-amber-900">
            {t('No fingerprinted tracks found.')}
          </p>
        </div>
      )}
    </>
  );
}
