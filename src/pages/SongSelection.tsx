import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { AnimatePresence, animate, motion, useMotionValue } from 'motion/react';
import { Search, ArrowLeft, Music2, Mic2 } from 'lucide-react';
import { clsx } from 'clsx';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/common';
import { useDarkMode } from '@/hooks/useDarkMode';
import { songsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { readStoredJson } from '@/utils/storage';
import type { NavigateToView } from '@/types';

interface Song {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
  requestedBy: { _id: string; nickname: string; profilePicture?: string | null } | null;
  eventId: string;
}

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

interface DjSongCardProps {
  isProcessing: boolean;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  song: Song;
}

const SWIPE_ACTION_THRESHOLD = 110;
const SWIPE_EXIT_PADDING = 96;

function getLocalStorageIds() {
  const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
  const participantData = readStoredJson<{ _id?: string }>('currentParticipant');
  const eventId = eventData?.eventId || null;
  const participantId = participantData?._id || null;
  return { eventId, participantId };
}

function SwipeBorderGlow() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="pointer-events-none fixed inset-0 z-[9999] bg-transparent"
      aria-hidden="true"
    >
      <style>
        {`
          .swipe-border-glow-svg {
            display: block;
            width: 100vw;
            height: 100vh;
            overflow: visible;
          }

          .swipe-border-line {
            fill: none;
            stroke-linecap: square;
            stroke-linejoin: miter;
            vector-effect: non-scaling-stroke;
          }

          .swipe-border-line.red {
            stroke: url(#swipe-red-gradient);
          }

          .swipe-border-line.green {
            stroke: url(#swipe-green-gradient);
          }

          .swipe-border-line.glow-mega {
            stroke-width: 72px;
            opacity: 1;
            filter: url(#swipe-mega-blur);
          }

          .swipe-border-line.glow-ambient {
            stroke-width: 112px;
            opacity: 1;
            filter: url(#swipe-ambient-blur);
          }

          .swipe-border-line.glow-strong {
            stroke-width: 44px;
            opacity: 1;
            filter: url(#swipe-strong-blur);
            animation: swipe-border-pulse 0.9s ease-in-out infinite alternate;
          }

          @keyframes swipe-border-pulse {
            from {
              opacity: 1;
              stroke-width: 38px;
            }

            to {
              opacity: 1;
              stroke-width: 56px;
            }
          }
        `}
      </style>

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="swipe-border-glow-svg"
      >
        <defs>
          <linearGradient id="swipe-red-gradient" x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff2a2a" stopOpacity="0.08" />
            <stop offset="14%" stopColor="#ff2a2a" stopOpacity="0.96" />
            <stop offset="50%" stopColor="#ff3b30" stopOpacity="1" />
            <stop offset="86%" stopColor="#ff2a2a" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#ff2a2a" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="swipe-green-gradient" x1="100" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00ff66" stopOpacity="0.08" />
            <stop offset="14%" stopColor="#00ff66" stopOpacity="0.96" />
            <stop offset="50%" stopColor="#22ff88" stopOpacity="1" />
            <stop offset="86%" stopColor="#00ff66" stopOpacity="0.96" />
            <stop offset="100%" stopColor="#00ff66" stopOpacity="0.08" />
          </linearGradient>
          <filter id="swipe-strong-blur" x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="22" />
          </filter>
          <filter id="swipe-mega-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="42" />
          </filter>
          <filter id="swipe-ambient-blur" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="68" />
          </filter>
        </defs>

        <path className="swipe-border-line glow-ambient red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-ambient green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
        <path className="swipe-border-line glow-mega red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-mega green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
        <path className="swipe-border-line glow-strong red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-strong green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
      </svg>
    </motion.div>
  );
}

function DjSongCardContent({ song }: { song: Song }) {
  return (
    <>
      <div className="relative z-10 flex items-center gap-3 md:gap-4">
        <UserAvatar
          name={song.requestedBy?.nickname || '?'}
          imageAlt={`${song.requestedBy?.nickname || 'Unknown'} profile`}
          className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-800 shadow-sm md:h-12 md:w-12"
          fallbackClassName="flex items-center justify-center text-base font-semibold text-white"
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <h3 className="truncate text-base font-semibold text-slate-900 md:text-lg">
            {song.title}
          </h3>
          <p className="truncate text-sm font-medium text-slate-500">
            {song.artist}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-slate-400">
            <UserAvatar
              name={song.requestedBy?.nickname || 'Unknown'}
              profilePicture={song.requestedBy?.profilePicture || null}
              imageAlt={`${song.requestedBy?.nickname || 'Unknown'} profile`}
              className="h-4 w-4 flex-shrink-0 overflow-hidden rounded-full border border-slate-300 bg-slate-200 shadow-sm"
              fallbackClassName="flex h-full w-full items-center justify-center bg-slate-700 text-[9px] font-semibold text-white"
            />
            {song.requestedBy?.nickname || 'Unknown'}
          </p>
        </div>
      </div>
    </>
  );
}

function DjSongCard({
  isProcessing,
  onApprove,
  onReject,
  song,
}: DjSongCardProps) {
  const x = useMotionValue(0);
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const pointerLockRef = React.useRef<'x' | 'y' | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);

  const getSwipeExitX = (direction: 'left' | 'right') => {
    if (typeof window === 'undefined') {
      return direction === 'right' ? 420 : -420;
    }

    const exitDistance = window.innerWidth + SWIPE_EXIT_PADDING;
    return direction === 'right' ? exitDistance : -exitDistance;
  };

  const finishSwipe = async (offsetX: number) => {
    if (Math.abs(offsetX) >= SWIPE_ACTION_THRESHOLD) {
      const direction = offsetX > 0 ? 'right' : 'left';

      animate(x, getSwipeExitX(direction), {
        duration: 0.18,
        ease: 'linear',
      });

      if (direction === 'right') {
        await onApprove();
      } else {
        await onReject();
      }

      x.set(0);
      return;
    }

    animate(x, 0, {
      duration: 0.14,
      ease: 'easeOut',
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isProcessing) {
      return;
    }

    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    pointerLockRef.current = null;
    setShowOverlay(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;

    if (!start || isProcessing) {
      return;
    }

    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;

    if (!pointerLockRef.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        return;
      }

      if (Math.abs(deltaX) > Math.abs(deltaY) + 6) {
        pointerLockRef.current = 'x';
      } else {
        pointerLockRef.current = 'y';
        return;
      }
    }

    if (pointerLockRef.current !== 'x') {
      return;
    }

    e.preventDefault();
    x.set(deltaX);
  };

  const handlePointerUp = async () => {
    const lockedAxis = pointerLockRef.current;
    const offsetX = x.get();

    pointerStartRef.current = null;
    pointerLockRef.current = null;
    setShowOverlay(false);

    if (lockedAxis !== 'x' || isProcessing) {
      return;
    }

    await finishSwipe(offsetX);
  };

  const handlePointerCancel = () => {
    pointerStartRef.current = null;
    pointerLockRef.current = null;
    setShowOverlay(false);
    animate(x, 0, {
      duration: 0.14,
      ease: 'easeOut',
    });
  };

  const handleDecisionKeyDown = async (
    e: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (isProcessing) {
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      await finishSwipe(SWIPE_ACTION_THRESHOLD);
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      await finishSwipe(-SWIPE_ACTION_THRESHOLD);
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 },
      }}
      className="relative overflow-hidden rounded-2xl"
    >
      <AnimatePresence>
        {showOverlay ? <SwipeBorderGlow /> : null}
      </AnimatePresence>

      <div
        aria-hidden="true"
        className="pointer-events-none invisible rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5"
      >
        <DjSongCardContent song={song} />
      </div>

      <motion.div
        style={{ x, touchAction: 'pan-y' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleDecisionKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Decide ${song.title}. Swipe right to approve or left to reject.`}
        className={clsx(
          'group absolute inset-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.10)] focus:outline-none focus:ring-4 focus:ring-sky-100 md:p-5',
          isProcessing ? 'cursor-wait opacity-80' : 'cursor-grab active:cursor-grabbing',
        )}
      >
        <DjSongCardContent song={song} />
      </motion.div>
    </motion.div>
  );
}

export function SongSelection({ mode, onNavigate }: Props) {
  const isDj = mode === 'dj';
  const theme = isDj ? 'blue' : 'green';
  const [isDarkMode] = useDarkMode();
  const navigateBack = useCallback(() => {
    onNavigate(isDj ? 'dj-dashboard' : 'attendee-dashboard');
  }, [isDj, onNavigate]);

  const { eventId, participantId } = getLocalStorageIds();

  /* DJ state */
  const [pendingSongs, setPendingSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingSongId, setProcessingSongId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* Attendee state */
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingSongs = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    try {
      const songs = await songsAPI.getPendingSongs(eventId);
      setPendingSongs(songs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load pending songs');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (isDj) {
      fetchPendingSongs();
    }
  }, [isDj, fetchPendingSongs]);

  useEffect(() => {
    if (!isDj) return undefined;

    const handleSongSuggested = (data: any) => {
      if (!data?.songId) return;

      setPendingSongs((current) => {
        if (current.some((song) => song._id === data.songId)) {
          return current;
        }

        return [
          ...current,
          {
            _id: data.songId,
            title: data.title || 'Untitled song',
            artist: data.artist || 'Unknown artist',
            voteScore: data.voteScore || 0,
            status: data.status || 'PENDING',
            requestedBy: data.requestedBy || null,
            eventId: data.eventId || eventId || '',
          },
        ];
      });
    };

    const removePendingSong = (data: any) => {
      if (!data?.songId) return;
      setPendingSongs((current) =>
        current.filter((song) => song._id !== data.songId),
      );
    };

    try {
      socket.onSongSuggested(handleSongSuggested);
      socket.onSongApproved(removePendingSong);
      socket.onSongRejected(removePendingSong);
    } catch {
      /* Socket not initialized yet */
    }

    return () => {
      socket.off('song_suggested', handleSongSuggested);
      socket.off('song_approved', removePendingSong);
      socket.off('song_rejected', removePendingSong);
    };
  }, [eventId, isDj]);

  const filteredSongs = pendingSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleApprove = async (songId: string) => {
    if (!eventId) return;
    setProcessingSongId(songId);
    try {
      await songsAPI.approveSong(eventId, songId);
      setPendingSongs((current) =>
        current.filter((song) => song._id !== songId),
      );
      toast.success('Song approved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve song');
    } finally {
      setProcessingSongId(null);
    }
  };

  const handleReject = async (songId: string) => {
    if (!eventId) return;
    setProcessingSongId(songId);
    try {
      await songsAPI.rejectSong(eventId, songId, 'Rejected by DJ');
      setPendingSongs((current) =>
        current.filter((song) => song._id !== songId),
      );
      toast.success('Song rejected');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject song');
    } finally {
      setProcessingSongId(null);
    }
  };

  const handleSuggest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !participantId || !title.trim() || !artist.trim()) return;
    setSubmitting(true);
    try {
      const song = await songsAPI.suggestSong(
        eventId,
        participantId,
        title.trim(),
        artist.trim(),
      );
      toast.success(`"${song.title}" suggested`);
      onNavigate('attendee-dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to suggest song');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (mode !== 'attendee' || e.key !== 'Tab') return;

    e.preventDefault();
    navigateBack();
  };

  const requestCardClassName = clsx(
    'relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border p-5 md:p-7',
    isDarkMode
      ? 'border-white/10 bg-[radial-gradient(circle_at_72%_18%,rgba(70,156,255,0.16),transparent_24%),linear-gradient(180deg,#182235_0%,#111827_100%)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : 'border-slate-900/10 bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfffd_100%)] text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );

  const requestTitleClassName = clsx(
    'text-[22px] font-black leading-tight tracking-normal',
    isDarkMode ? 'text-white' : 'text-[#101c3a]',
  );

  const requestHelperClassName = clsx(
    'mt-1.5 text-[13px] font-bold leading-snug tracking-normal',
    isDarkMode ? 'text-slate-300' : 'text-[#73829d]',
  );

  const requestFieldClassName = clsx(
    'group flex h-[52px] min-w-0 cursor-text items-center gap-3.5 rounded-xl border px-[18px]',
    isDarkMode
      ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md'
      : 'border-slate-900/10 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );

  const requestIconClassName = clsx(
    'h-5 w-5 flex-shrink-0 transition-colors group-focus-within:text-emerald-500',
    isDarkMode ? 'text-slate-300' : 'text-[#526990]',
  );

  const requestInputClassName = clsx(
    'h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-normal outline-none placeholder:font-normal placeholder:tracking-normal',
    isDarkMode
      ? 'text-white placeholder:text-slate-400'
      : 'text-[#14213f] placeholder:text-[#8b9ab4]',
  );

  const requestButtonClassName = clsx(
    'mt-1 h-[52px] w-full rounded-xl text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(16,185,129,0.24)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100',
    submitting || !title.trim() || !artist.trim()
      ? isDarkMode
        ? 'cursor-not-allowed bg-slate-500/70 opacity-80 shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
        : 'cursor-not-allowed bg-slate-400 opacity-80 shadow-[0_10px_20px_rgba(15,23,42,0.08)]'
      : isDarkMode
        ? 'cursor-pointer bg-emerald-500 hover:bg-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.20)] focus-visible:ring-emerald-200'
        : 'cursor-pointer bg-emerald-500 hover:bg-emerald-600',
  );

  return (
    <Layout
      theme={theme}
      className="px-5 py-6 md:px-10 md:py-8"
      showNav={true}
    >
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col">
        <div className="absolute left-0 top-0 z-20">
          <motion.button
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.98 }}
            onClick={navigateBack}
            onKeyDown={handleBackKeyDown}
            className="flex h-11 items-center gap-2 rounded-full border border-white/55 bg-white/16 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 backdrop-blur-md transition-colors hover:bg-white/24"
          >
            <ArrowLeft size={18} />
            Back
          </motion.button>
        </div>

        <div className="mb-8 flex min-h-11 items-center justify-center px-24 md:mb-10">
          <motion.h1
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center text-2xl font-semibold tracking-normal text-white drop-shadow-sm md:text-4xl"
          >
            {isDj ? 'Pending Requests' : 'Suggest a Song'}
          </motion.h1>
        </div>

        {isDj ? (
          <>
            {/* Search Bar */}
            <motion.label
              layoutId="search-bar"
              className="group mx-auto mb-6 mt-2 flex h-[52px] w-full max-w-2xl cursor-text items-center gap-3.5 rounded-xl border border-slate-900/10 bg-white px-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] md:mb-8 md:mt-4"
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
            </motion.label>

            {/* Song List */}
            {loading ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                Loading…
              </p>
            ) : filteredSongs.length === 0 ? (
              <p className="self-center rounded-full bg-white/14 px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md">
                No pending songs
              </p>
            ) : (
              <motion.div
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
              </motion.div>
            )}
          </>
        ) : (
          /* Attendee: Suggest Song Form */
          <motion.form
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onSubmit={handleSuggest}
            className={requestCardClassName}
          >
            <div
              className="pointer-events-none absolute left-[58%] top-7 hidden h-[50px] w-[190px] opacity-45 md:block"
              aria-hidden="true"
            >
              <svg viewBox="0 0 190 50" className="h-full w-full">
                <g className="fill-[#34d399] opacity-35">
                  <circle cx="4" cy="24" r="1.4" />
                  <circle cx="10" cy="22" r="1.4" />
                  <circle cx="16" cy="20" r="1.4" />
                  <circle cx="22" cy="18" r="1.4" />
                  <circle cx="28" cy="16" r="1.4" />
                  <circle cx="34" cy="20" r="1.4" />
                  <circle cx="40" cy="24" r="1.4" />
                  <circle cx="46" cy="28" r="1.4" />
                  <circle cx="52" cy="32" r="1.4" />
                </g>
                <g className="fill-[#10b981] opacity-45">
                  <circle cx="64" cy="21" r="1.5" />
                  <circle cx="70" cy="15" r="1.5" />
                  <circle cx="76" cy="10" r="1.5" />
                  <circle cx="82" cy="12" r="1.5" />
                  <circle cx="88" cy="20" r="1.5" />
                  <circle cx="94" cy="27" r="1.5" />
                  <circle cx="100" cy="34" r="1.5" />
                </g>
                <g className="fill-[#6ee7b7] opacity-40">
                  <circle cx="112" cy="31" r="1.5" />
                  <circle cx="118" cy="26" r="1.5" />
                  <circle cx="124" cy="21" r="1.5" />
                  <circle cx="130" cy="18" r="1.5" />
                  <circle cx="136" cy="20" r="1.5" />
                  <circle cx="142" cy="25" r="1.5" />
                  <circle cx="148" cy="30" r="1.5" />
                </g>
              </svg>
            </div>

            <div className="relative z-10 mb-5">
              <h2 className={requestTitleClassName}>
                Request a track
              </h2>
              <p className={requestHelperClassName}>
                Add a song suggestion to the DJ queue.
              </p>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <label className={requestFieldClassName}>
                <Music2 className={requestIconClassName} />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="Song title"
                  placeholder="Song title"
                  required
                  className={requestInputClassName}
                />
              </label>

              <label className={requestFieldClassName}>
                <Mic2 className={requestIconClassName} />
                <input
                  type="text"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  aria-label="Artist"
                  placeholder="Artist"
                  required
                  className={requestInputClassName}
                />
              </label>

              <motion.button
                type="submit"
                disabled={submitting || !title.trim() || !artist.trim()}
                whileHover={
                  submitting || !title.trim() || !artist.trim()
                    ? undefined
                    : { y: -1 }
                }
                whileTap={
                  submitting || !title.trim() || !artist.trim()
                    ? undefined
                    : { scale: 0.98 }
                }
                className={requestButtonClassName}
              >
                {submitting ? 'Submitting…' : 'Suggest Song'}
              </motion.button>
            </div>
          </motion.form>
        )}
      </div>
    </Layout>
  );
}
