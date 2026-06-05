import React from 'react';
import { LazyMotion, m } from 'motion/react';
import { clsx } from 'clsx';
import { X, SkipForward } from 'lucide-react';
import type { Song } from '@/types/songs';
import type { RemovalReason } from '@/features/dashboard/useQueueRealtime';

export interface FallingQueueCardProps {
  song: Song;
  reason: RemovalReason;
  index: number;
  isDarkMode: boolean;
}

export function FallingQueueCard({
  song,
  reason,
  index,
  isDarkMode,
}: FallingQueueCardProps) {
  const isRejected = reason === 'rejected';

  return (
    <m.div
      className={clsx(
        'pointer-events-none fixed left-1/2 top-28 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border p-4 shadow-2xl backdrop-blur-xl',
        isDarkMode
          ? 'border-white/10 bg-slate-900/90 text-slate-100'
          : 'border-slate-200 bg-white/95 text-slate-800',
      )}
      initial={{
        opacity: 0,
        y: -10,
        rotate: index % 2 === 0 ? -2 : 2,
        scale: 0.98,
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-10, 18, 260],
        x: [0, index % 2 === 0 ? -12 : 12, index % 2 === 0 ? -36 : 36],
        rotate: index % 2 === 0 ? [-2, 3, -7] : [2, -3, 7],
        scale: [0.98, 1, 0.94],
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeIn' }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-white',
            isRejected ? 'bg-rose-500' : 'bg-slate-500',
          )}
        >
          {isRejected ? <X size={18} /> : <SkipForward size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{song.title}</p>
          <p
            className={clsx(
              'truncate text-xs',
              isDarkMode ? 'text-slate-400' : 'text-slate-500',
            )}
          >
            {isRejected ? 'Rejected by votes' : 'Skipped from the queue'}
          </p>
        </div>
      </div>
    </m.div>
  );
}
