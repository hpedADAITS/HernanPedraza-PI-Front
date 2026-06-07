import React, { useState } from 'react';
import { AnimatePresence, animate, m, useMotionValue } from 'motion/react';
import { clsx } from 'clsx';
import { Disc3, Sparkles, ArrowLeft, ArrowRight, Link2 } from 'lucide-react';
import { UserAvatar } from '@/components/common';
import type { Song } from '@/types/songs';

export interface SongSelectionSong {
  _id: string;
  title: string;
  artist: string;
  voteScore: number;
  status: string;
  requestedBy: { _id: string; nickname: string; profilePicture?: string | null } | null;
  recognitionMatch?: Song['recognitionMatch'];
  eventId: string;
}

interface DjSongCardProps {
  isProcessing: boolean;
  onApprove: () => Promise<void>;
  onClick?: () => void;
  onMatchMetadata?: () => void;
  onReject: () => Promise<void>;
  song: SongSelectionSong;
}

const SWIPE_ACTION_THRESHOLD = 110;
const SWIPE_EXIT_PADDING = 96;
const DECISION_SIDE_RATIO = 0.34;

function releasePointerCapture(target: HTMLDivElement, pointerId: number) {
  if (target.hasPointerCapture?.(pointerId)) target.releasePointerCapture(pointerId);
}

function getSwipeExitX(direction: 'left' | 'right') {
  if (typeof window === 'undefined') return direction === 'right' ? 420 : -420;
  const exitDistance = window.innerWidth + SWIPE_EXIT_PADDING;
  return direction === 'right' ? exitDistance : -exitDistance;
}

function getReleaseDirection(clientX: number) {
  if (typeof window === 'undefined') return null;
  const sideWidth = window.innerWidth * DECISION_SIDE_RATIO;
  if (clientX <= sideWidth) return 'left';
  if (clientX >= window.innerWidth - sideWidth) return 'right';
  return null;
}

function SwipeBorderGlow() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="pointer-events-none fixed inset-0 z-[9999] bg-transparent"
      aria-hidden="true"
    >
      <style>
        {`
          .swipe-border-glow-svg { display: block; width: 100vw; height: 100vh; overflow: visible; }
          .swipe-border-line { fill: none; stroke-linecap: square; stroke-linejoin: miter; vector-effect: non-scaling-stroke; }
          .swipe-border-line.red { stroke: url(#swipe-red-gradient); }
          .swipe-border-line.green { stroke: url(#swipe-green-gradient); }
          .swipe-border-line.glow-mega { stroke-width: 72px; opacity: 1; filter: url(#swipe-mega-blur); }
          .swipe-border-line.glow-ambient { stroke-width: 112px; opacity: 1; filter: url(#swipe-ambient-blur); }
          .swipe-border-line.glow-strong { stroke-width: 44px; opacity: 1; filter: url(#swipe-strong-blur); animation: swipe-border-pulse 0.9s ease-in-out infinite alternate; }
          @keyframes swipe-border-pulse { from { opacity: 1; stroke-width: 38px; } to { opacity: 1; stroke-width: 56px; } }
        `}
      </style>

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="swipe-border-glow-svg">
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
          <filter id="swipe-strong-blur" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="22" /></filter>
          <filter id="swipe-mega-blur" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="42" /></filter>
          <filter id="swipe-ambient-blur" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="68" /></filter>
        </defs>

        <path className="swipe-border-line glow-ambient red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-ambient green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
        <path className="swipe-border-line glow-mega red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-mega green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
        <path className="swipe-border-line glow-strong red" d="M 50 0 L 0 0 L 0 100 L 50 100" />
        <path className="swipe-border-line glow-strong green" d="M 50 0 L 100 0 L 100 100 L 50 100" />
      </svg>
    </m.div>
  );
}

function DjSongCardContent({
  onMatchMetadata,
  song,
}: {
  onMatchMetadata?: () => void;
  song: SongSelectionSong;
}) {
  const match = song.recognitionMatch;
  const matchLabel = match?.source === 'musicbrainz' ? 'MusicBrainz match' : 'Fingerprint match';
  const canMatchMetadata = match?.source === 'musicbrainz' && onMatchMetadata;

  return (
    <div className="relative z-10 space-y-3">
      <div className="flex items-center gap-3 md:gap-4">
        <UserAvatar
          name={song.requestedBy?.nickname || '?'}
          imageAlt={`${song.requestedBy?.nickname || 'Unknown'} profile`}
          className="h-11 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-800 shadow-sm md:h-12 md:w-12"
          fallbackClassName="flex items-center justify-center text-base font-semibold text-white"
        />

        <div className="flex min-w-0 flex-1 items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="truncate text-base font-semibold text-slate-900 md:text-lg">{song.title}</h3>
            <p className="truncate text-sm font-medium text-slate-500">{song.artist}</p>
            <div className="mt-1 flex items-center gap-1.5 truncate text-xs font-medium text-slate-400">
              <UserAvatar
                name={song.requestedBy?.nickname || 'Unknown'}
                profilePicture={song.requestedBy?.profilePicture || null}
                imageAlt={`${song.requestedBy?.nickname || 'Unknown'} profile`}
                className="h-4 w-4 flex-shrink-0 overflow-hidden rounded-full border border-slate-300 bg-slate-200 shadow-sm"
                fallbackClassName="flex h-full w-full items-center justify-center bg-slate-700 text-[9px] font-semibold text-white"
              />
              {song.requestedBy?.nickname || 'Unknown'}
            </div>
          </div>
          {canMatchMetadata ? (
            <button
              type="button"
              data-no-swipe="true"
              onClick={(event) => {
                event.stopPropagation();
                onMatchMetadata();
              }}
              className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-sky-200 bg-sky-50 text-sky-700 shadow-sm transition-colors hover:bg-sky-100 focus:outline-none focus:ring-4 focus:ring-sky-100"
              aria-label={`Match MusicBrainz metadata for ${song.title}`}
            >
              <Link2 size={17} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {match ? (
        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/85 p-2.5 shadow-inner">
          <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-lg bg-sky-100 text-sky-700">
            {match.coverUrl ? (
              <img src={match.coverUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <Disc3 size={22} />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              <Sparkles size={12} />
              {matchLabel} {Math.round(match.score * 100)}%
            </p>
            <p className="truncate text-sm font-semibold text-slate-900">{match.title}</p>
            <p className="truncate text-xs font-medium text-slate-500">{match.artist}</p>
          </div>
        </div>
      ) : null}

      {/* Keyboard hint icons */}
      <div className="flex items-center justify-end gap-0.5 pt-1 opacity-40 transition-opacity group-hover:opacity-60">
        <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          <ArrowLeft size={10} className="text-red-400" />
          Reject
        </span>
        <span className="text-slate-300">|</span>
        <span className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          Approve
          <ArrowRight size={10} className="text-green-500" />
        </span>
      </div>
    </div>
  );
}

export function DjSongCard({ isProcessing, onApprove, onClick, onMatchMetadata, onReject, song }: DjSongCardProps) {
  const x = useMotionValue(0);
  const pointerStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const pointerLockRef = React.useRef<'x' | 'y' | null>(null);
  const pointerMovedRef = React.useRef(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const finishDecision = async (direction: 'left' | 'right') => {
    animate(x, getSwipeExitX(direction), { duration: 0.18, ease: 'linear' });
    if (direction === 'right') await onApprove();
    else await onReject();
    x.set(0);
  };

  const finishKeyboardSwipe = async (offsetX: number) => {
    if (Math.abs(offsetX) >= SWIPE_ACTION_THRESHOLD) {
      await finishDecision(offsetX > 0 ? 'right' : 'left');
      return;
    }
    animate(x, 0, { duration: 0.14, ease: 'easeOut' });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if ((e.target as HTMLElement).closest('[data-no-swipe="true"]')) return;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    pointerLockRef.current = null;
    pointerMovedRef.current = false;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current;
    if (!start || isProcessing) return;

    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;

    if (!pointerLockRef.current) {
      if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) {
        // Small movement - still potentially a click
        return;
      }
      // Mark as moved - this is a drag/swipe, not a click
      pointerMovedRef.current = true;
      if (Math.abs(deltaX) > Math.abs(deltaY) + 6) pointerLockRef.current = 'x';
      else {
        pointerLockRef.current = 'y';
        return;
      }
    }

    if (pointerLockRef.current !== 'x') return;
    e.preventDefault();
    setShowOverlay(true);
    x.set(deltaX);
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    const lockedAxis = pointerLockRef.current;
    const direction = getReleaseDirection(e.clientX);

    pointerStartRef.current = null;
    pointerLockRef.current = null;
    setShowOverlay(false);
    releasePointerCapture(e.currentTarget, e.pointerId);

    // Handle click if there was minimal movement and onClick is provided
    if (!pointerMovedRef.current && onClick) {
      onClick();
      pointerMovedRef.current = false;
      return;
    }
    pointerMovedRef.current = false;

    if (lockedAxis !== 'x' || isProcessing) return;
    if (direction) {
      await finishDecision(direction);
      return;
    }
    animate(x, 0, { duration: 0.14, ease: 'easeOut' });
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = null;
    pointerLockRef.current = null;
    pointerMovedRef.current = false;
    setShowOverlay(false);
    releasePointerCapture(e.currentTarget, e.pointerId);
    animate(x, 0, { duration: 0.14, ease: 'easeOut' });
  };

  const handleDecisionKeyDown = async (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isProcessing) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      await finishKeyboardSwipe(SWIPE_ACTION_THRESHOLD);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      await finishKeyboardSwipe(-SWIPE_ACTION_THRESHOLD);
    }
  };

  return (
    <m.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }} className="relative overflow-hidden rounded-2xl">
      <AnimatePresence>{showOverlay ? <SwipeBorderGlow /> : null}</AnimatePresence>
      <div aria-hidden="true" className="pointer-events-none invisible rounded-2xl border border-slate-200/80 bg-white p-4 md:p-5">
        <DjSongCardContent onMatchMetadata={onMatchMetadata} song={song} />
      </div>
      <m.div
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
        <DjSongCardContent onMatchMetadata={onMatchMetadata} song={song} />
      </m.div>
    </m.div>
  );
}
