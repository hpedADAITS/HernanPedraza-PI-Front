import React, { type MouseEvent } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'motion/react';
import { clsx } from 'clsx';
import { SkipForward } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { THEME_CONFIG } from '@/constants/dashboard';
import { SLIDE_UP, ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI } from '@/services/api';
import { getStoredDjUserId, getStoredParticipantId } from '@/services/session';
import { useQueueRealtime } from '@/features/dashboard/useQueueRealtime';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';
import { QueueItem } from './QueueItem';
import { FallingQueueCard } from './FallingQueueCard';

interface QueueListProps {
  mode: 'attendee' | 'dj';
  eventId?: string;
  participantId?: string;
  isDarkMode?: boolean;
}

export function QueueList({
  mode,
  eventId: propEventId,
  isDarkMode = false,
}: QueueListProps) {
  const isDj = mode === 'dj';
  const primaryColor = THEME_CONFIG[isDj ? 'dj' : 'attendee'].primaryColor;
  const { toast } = useToast();
  const {
    fallingCards,
    loading,
    removeSong,
    resolvedEventId,
    selectSong,
    selectedSongId,
    sortedSongs,
    waitTimes,
  } = useQueueRealtime(mode, propEventId);
  const participantId = getStoredParticipantId() || null;
  const djUserId = isDj ? getStoredDjUserId() : null;

  const handleAdminAction = async (action: string, e: MouseEvent) => {
    e.stopPropagation();
    if (action !== 'Play Next') return;
    if (!resolvedEventId) {
      toast.error(t('Event ID not found'));
      return;
    }
    const played = await songsAPI.playNext(resolvedEventId);
    if (played) {
      toast.success(t('Now playing "{title}"', { title: played.title }));
    } else {
      toast.error(t('No songs in queue to play'));
    }
  };

  return (
    <LazyMotion features={domAnimation}>
      <TooltipProvider>
        <m.div
          {...SLIDE_UP}
          transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
          layout
          className={clsx(
            'relative flex min-h-[190px] flex-1 flex-col overflow-hidden rounded-[14px] border backdrop-blur-xl',
          )}
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(8, 17, 34, 0.88)'
              : 'rgba(255, 255, 255, 0.86)',
            borderColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(15, 23, 42, 0.07)',
            boxShadow: isDarkMode
              ? '0 18px 38px rgba(2, 8, 23, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
              : '0 12px 28px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.92)',
            backgroundImage: isDarkMode
              ? 'radial-gradient(circle at 50% 54%, rgba(47, 124, 255, 0.10), transparent 28%), linear-gradient(135deg, #081122 0%, #0d1b35 100%)'
              : 'radial-gradient(circle at 52% 55%, rgba(47, 124, 255, 0.035), transparent 26%)',
          }}
        >
          <AnimatePresence>
            {fallingCards.map((card, index) => (
              <FallingQueueCard
                key={card.id}
                song={card.song}
                reason={card.reason}
                index={index}
                isDarkMode={isDarkMode}
              />
            ))}
          </AnimatePresence>

          <header
            className={clsx(
              'flex items-start justify-between gap-3 px-6 pt-5 sm:px-6 sm:pt-6',
            )}
          >
            <QueueHeader isDarkMode={isDarkMode} />
            {isDj && sortedSongs.some((s) => s.status === 'APPROVED') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <m.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => handleAdminAction('Play Next', e)}
                    className={clsx(
                      'mt-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white shadow-md transition-colors',
                      isDarkMode ? 'bg-emerald-700 hover:bg-emerald-600' : 'bg-emerald-600 hover:bg-emerald-500',
                    )}
                  >
                    <SkipForward size={14} />
                    <span className="hidden sm:inline">Play Next</span>
                  </m.button>
                </TooltipTrigger>
                <TooltipContent>Play highest voted song</TooltipContent>
              </Tooltip>
            )}
          </header>

          <m.div
            layout
            transition={{ type: 'spring', stiffness: 380, damping: 42 }}
            className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-5 pt-4 sm:px-6 sm:pb-6"
          >
            <AnimatePresence mode="wait">
              {loading ? (
                <m.div
                  key="loading"
                  layout
                  className={clsx(
                    'py-8 text-sm font-medium',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500',
                  )}
                >
                  Loading queue…
                </m.div>
              ) : sortedSongs.length > 0 ? (
                <m.div
                  key="queue-list"
                  layout
                  className="flex flex-col gap-3"
                >
                  <AnimatePresence>
                    {sortedSongs.map((song, i) => {
                      const isMine =
                        !!participantId &&
                        song.requestedBy?._id === participantId;
                      const wait = waitTimes.get(song._id);
                      return (
                        <QueueItem
                          key={song._id}
                          song={song}
                          position={song.queuePosition ?? i + 1}
                          context={{
                            first: i === 0,
                            mode,
                            selected: selectedSongId === song._id,
                            mine: isMine,
                          }}
                          primaryColor={primaryColor}
                          onSelect={selectSong}
                          onSongRemoved={removeSong}
                          eventId={resolvedEventId || undefined}
                          isDarkMode={isDarkMode}
                          waitSeconds={wait}
                          djUserId={djUserId}
                          djParticipantId={participantId}
                        />
                      );
                    })}
                  </AnimatePresence>
                </m.div>
              ) : (
                <QueueEmptyState
                  key="empty-state"
                  isDarkMode={isDarkMode}
                />
              )}
            </AnimatePresence>
          </m.div>
        </m.div>
      </TooltipProvider>
    </LazyMotion>
  );
}

function QueueHeader({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <>
      <svg
        className={clsx(
          'mt-0.5 h-[18px] w-[18px] flex-shrink-0',
          isDarkMode ? 'text-slate-400' : 'text-slate-500',
        )}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M9 7h10M9 12h10M9 17h10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M4.5 7h.01M4.5 12h.01M4.5 17h.01"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      <div>
        <h3
          className={clsx(
            'text-[13px] font-extrabold leading-tight tracking-[-0.02em]',
            isDarkMode ? 'text-slate-50' : 'text-slate-900',
          )}
        >
          Up Next
        </h3>
        <p
          className={clsx(
            'mt-1 text-[11px] font-semibold leading-tight',
            isDarkMode ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          Songs in the queue
        </p>
      </div>
    </>
  );
}

function QueueEmptyState({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <m.div
      layout
      className="flex flex-1 items-center justify-center py-8"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: ANIMATION_DURATION.normal }}
    >
      <div className="relative w-[260px] max-w-full text-center sm:w-[220px]">
        <div
          className={clsx(
            'relative mx-auto mb-[9px] grid h-[58px] w-[58px] place-items-center rounded-full',
            isDarkMode ? 'bg-sky-500/12' : 'bg-sky-100',
          )}
        >
          <span
            className="absolute left-[-24px] top-[27px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#ff4f9a' }}
            aria-hidden="true"
          />
          <span
            className="absolute left-[-10px] top-[43px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#2f7cff' }}
            aria-hidden="true"
          />
          <span
            className="absolute right-[-18px] top-[21px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#32d583' }}
            aria-hidden="true"
          />
          <span
            className="absolute right-[-11px] top-[42px] h-[3px] w-[3px] rounded-full"
            style={{ backgroundColor: '#f8c84e' }}
            aria-hidden="true"
          />

          <svg
            className={clsx(
              'h-[25px] w-[25px]',
              isDarkMode ? 'text-sky-400' : 'text-blue-600',
            )}
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 17.2a3.2 3.2 0 1 1-1.9-2.9V7.2c0-.8.5-1.4 1.3-1.6l7.4-1.5c.6-.1 1.2.3 1.2.9v2.1l-7.2 1.5v8.6H10Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h3
          className={clsx(
            'text-[13px] font-extrabold leading-tight tracking-[-0.02em]',
            isDarkMode ? 'text-slate-50' : 'text-slate-900',
          )}
        >
          The queue is empty
        </h3>
        <p
          className={clsx(
            'mt-1 text-[12px] font-semibold leading-tight',
            isDarkMode ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          Be the first to request a song!
        </p>
      </div>
    </m.div>
  );
}
