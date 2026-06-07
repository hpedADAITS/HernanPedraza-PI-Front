import { Disc3, Library, Sparkles, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { UserAvatar } from '@/components/common';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';
import type { SongSelectionSong } from '@/features/song-selection/DjSongCard';

interface DjRequestReviewDialogProps {
  isProcessing: boolean;
  onApprove: () => Promise<unknown>;
  onClose: () => void;
  onNavigate?: NavigateToView;
  onReject: () => Promise<unknown>;
  song: SongSelectionSong | null;
}

export function DjRequestReviewDialog({
  isProcessing,
  onApprove,
  onClose,
  onNavigate,
  onReject,
  song,
}: DjRequestReviewDialogProps) {
  const match = song?.recognitionMatch;
  const matchLabel = match?.source === 'musicbrainz'
    ? t('MusicBrainz match {score}%', { score: Math.round(match.score * 100) })
    : t('DB fingerprint match {score}%', { score: Math.round((match?.score || 0) * 100) });

  return (
    <AnimatePresence>
      {song ? (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={t('Review request {title}', { title: song.title })}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-900/10 bg-white text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-sky-600">
                  {t('New attendee request')}
                </p>
                <h2 className="mt-1 truncate text-xl font-black tracking-normal text-slate-950">
                  {t('Review song')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-sm transition-colors hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={t('Close request review')}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <UserAvatar
                  name={song.requestedBy?.nickname || t('Unknown')}
                  profilePicture={song.requestedBy?.profilePicture || null}
                  imageAlt={t('{name} profile', { name: song.requestedBy?.nickname || t('Unknown') })}
                  className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-800"
                  fallbackClassName="flex h-full w-full items-center justify-center text-base font-semibold text-white"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    {t('Requested by')}
                  </p>
                  <p className="truncate text-sm font-bold text-slate-800">
                    {song.requestedBy?.nickname || t('Unknown attendee')}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  {t('Attendee entered')}
                </p>
                <h3 className="mt-1 break-words text-lg font-black leading-tight text-slate-950">
                  {song.title}
                </h3>
                <p className="mt-1 break-words text-sm font-semibold text-slate-500">
                  {song.artist}
                </p>
              </div>

              {match ? (
                <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
                  <div className="grid h-14 w-14 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-sky-100 text-sky-700">
                    {match.coverUrl ? (
                      <img src={match.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Disc3 size={24} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-sky-700">
                      <Sparkles size={13} aria-hidden="true" />
                      {matchLabel}
                    </p>
                    <p className="mt-1 truncate text-sm font-black text-slate-950">
                      {match.title}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {match.artist}
                    </p>
                    {onNavigate && match.source !== 'musicbrainz' ? (
                      <button
                        type="button"
                        onClick={() => onNavigate('dj-fingerprints')}
                        className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-sky-600 underline underline-offset-2"
                      >
                        <Library size={12} aria-hidden="true" />
                        {t('View in library')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                  {t('No DB fingerprint match found.')}
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={onReject}
                disabled={isProcessing}
                className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Deny')}
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={isProcessing}
                className="h-11 flex-1 rounded-xl bg-[#2878ff] px-4 text-sm font-black text-white shadow-[0_10px_20px_rgba(40,120,255,0.25)] transition-colors hover:bg-[#1f66dc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('Approve to queue')}
              </button>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
