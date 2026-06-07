import { useState } from 'react';
import { ArrowLeft, ArrowRight, Disc3, Link2 } from 'lucide-react';
import { clsx } from 'clsx';
import { t } from '@/i18n';

export type CoverflowItem =
  | { type: 'musicbrainz'; id: string; title: string; artist: string; coverUrl?: string | null; detail: string; hashSignature?: string | null }
  | { type: 'track'; id: string; title: string; artist: string; coverUrl?: string | null; detail: string; hashSignature?: string | null };

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
      {selected ? (
        <div className="mx-auto flex min-h-[250px] w-full max-w-md flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center shadow-inner">
          <p className="text-[11px] font-black uppercase tracking-normal text-slate-400">
            {selected.type === 'musicbrainz' ? t('MusicBrainz data') : t('DJ fingerprint')}
          </p>
          <h3 className="mt-1 max-w-full truncate text-lg font-black text-slate-950">
            {selected.title}
          </h3>
          <p className="max-w-full truncate text-sm font-bold text-slate-500">
            {selected.artist}
          </p>
          {selected.hashSignature ? (
            <p className="mt-1 max-w-full truncate font-mono text-[10px] font-semibold text-slate-400">
              &#x2317; {selected.hashSignature}
            </p>
          ) : null}
          <div className="mt-4 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={items.length < 2 || isProcessing}
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('Previous')}
            >
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onSelect?.(selected)}
              disabled={isProcessing}
              className={clsx(
                'grid h-36 w-36 flex-shrink-0 place-items-center overflow-hidden rounded-2xl transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                selected.type === 'musicbrainz'
                  ? 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
              )}
              aria-label={selected.title}
            >
              {selected.coverUrl ? (
                <img src={selected.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : selected.type === 'musicbrainz' ? (
                <Disc3 size={44} aria-hidden="true" />
              ) : (
                <Link2 size={42} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={items.length < 2 || isProcessing}
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={t('Next')}
            >
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
          <p className="mt-3 text-xs font-black uppercase tracking-normal text-slate-400">
            {index + 1} / {items.length}
          </p>
          <p className="mt-2 max-w-full truncate text-xs font-semibold text-slate-400">
            {selected.detail}
          </p>
        </div>
      ) : (
        <div className="mx-auto flex min-h-[250px] w-full max-w-sm flex-col items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="mb-4 flex w-full items-center justify-center gap-3">
            <button
              type="button"
              disabled
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-amber-200 bg-white/70 text-amber-500 opacity-40"
              aria-label={t('Previous')}
            >
              <ArrowLeft size={19} aria-hidden="true" />
            </button>
            <div
              className="grid h-32 w-32 flex-shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-500"
              aria-hidden="true"
            >
              <Disc3 size={44} />
            </div>
            <button
              type="button"
              disabled
              className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl border border-amber-200 bg-white/70 text-amber-500 opacity-40"
              aria-label={t('Next')}
            >
              <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm font-bold text-amber-900">
            {t('No fingerprinted tracks found.')}
          </p>
        </div>
      )}
    </>
  );
}
