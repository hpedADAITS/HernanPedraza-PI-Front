import React from 'react';
import { m } from 'motion/react';
import { Mic } from 'lucide-react';
import { CoverCube } from './CoverCube';

type PlayerState =
  | 'playing'
  | 'rejected'
  | 'queued'
  | 'priority'
  | 'skipped'
  | 'idle';

interface NowPlayingProps {
  songTitle?: string;
  artist?: string;
  albumArt?: string;
  currentTime?: string;
  duration?: string;
  progress?: number;
  status?: PlayerState;
  waitLabel?: string;
  attentionKey?: number;
  celebrateKey?: number;
  microphoneLabel?: string;
  audioLevel?: number;
  pcmData?: Float32Array;
}

const waveformBars = [
  [6, 44, 50],
  [13, 38, 56],
  [20, 31, 63],
  [27, 24, 70],
  [34, 12, 82],
  [41, 5, 89],
  [48, 17, 77],
  [55, 23, 71],
  [62, 29, 65],
  [69, 34, 60],
  [76, 25, 69],
  [83, 19, 75],
  [90, 23, 71],
  [97, 29, 65],
  [104, 25, 69],
  [111, 20, 74],
  [118, 25, 69],
  [125, 31, 63],
  [132, 36, 58],
  [139, 32, 62],
  [146, 27, 67],
  [153, 22, 72],
  [160, 15, 79],
  [167, 5, 89],
  [174, 13, 81],
  [181, 22, 72],
  [188, 29, 65],
  [195, 35, 59],
  [202, 41, 53],
  [209, 45, 49],
] as const;

const stateConfig: Record<
  PlayerState,
  {
    statusLabel: string;
    subtitle: string;
    badge: string;
    color: string;
    background: string;
  }
> = {
  playing: {
    statusLabel: 'NOW PLAYING',
    subtitle: 'Song is currently live',
    badge: 'Active playback',
    color: '#32d583',
    background:
      'radial-gradient(circle at 16% 48%, rgba(50, 213, 131, .22), transparent 34%), radial-gradient(circle at 82% 42%, rgba(45, 212, 191, .24), transparent 38%), linear-gradient(135deg, #061b18 0%, #0f3d35 48%, #126b5b 100%)',
  },
  queued: {
    statusLabel: 'QUEUED',
    subtitle: 'Accepted into the upcoming list',
    badge: 'Waiting turn',
    color: '#3d7cff',
    background:
      'radial-gradient(circle at 16% 48%, rgba(89, 146, 255, .18), transparent 32%), radial-gradient(circle at 85% 40%, rgba(42, 98, 174, .28), transparent 38%), linear-gradient(135deg, #071224 0%, #11274b 48%, #183b70 100%)',
  },
  priority: {
    statusLabel: 'PRIORITY',
    subtitle: 'Boosted request with higher visibility',
    badge: 'Priority queue',
    color: '#f8c84e',
    background:
      'radial-gradient(circle at 16% 48%, rgba(248, 200, 78, .25), transparent 34%), radial-gradient(circle at 85% 40%, rgba(255, 153, 51, .30), transparent 38%), linear-gradient(135deg, #241806 0%, #5a3c0c 48%, #a96b12 100%)',
  },
  skipped: {
    statusLabel: 'SKIPPED',
    subtitle: 'Passed over by the DJ',
    badge: 'Not played',
    color: '#94a3b8',
    background:
      'radial-gradient(circle at 16% 48%, rgba(148, 163, 184, .22), transparent 34%), radial-gradient(circle at 85% 40%, rgba(71, 85, 105, .32), transparent 38%), linear-gradient(135deg, #111827 0%, #273244 48%, #475569 100%)',
  },
  rejected: {
    statusLabel: 'REJECTED',
    subtitle: 'Denied by moderation or party rules',
    badge: 'Request declined',
    color: '#ff4f66',
    background:
      'radial-gradient(circle at 16% 48%, rgba(255, 79, 102, .24), transparent 34%), radial-gradient(circle at 85% 40%, rgba(190, 24, 93, .30), transparent 38%), linear-gradient(135deg, #260611 0%, #5f1026 48%, #a4163a 100%)',
  },
  idle: {
    statusLabel: 'NO SONG PLAYING',
    subtitle: 'Approve requests into the queue, then choose the next song to play',
    badge: 'Queue controls playback',
    color: '#94a3b8',
    background:
      'radial-gradient(circle at 16% 48%, rgba(148, 163, 184, .18), transparent 34%), radial-gradient(circle at 85% 40%, rgba(71, 85, 105, .28), transparent 38%), linear-gradient(135deg, #111827 0%, #273244 48%, #475569 100%)',
  },
};

function Waveform() {
  return (
    <svg
      className="hidden h-[75px] w-[171px] justify-self-end opacity-70 lg:block"
      viewBox="0 0 214 94"
      aria-hidden="true"
    >
      <g
        stroke="rgba(255,255,255,.24)"
        strokeWidth="2"
        strokeLinecap="round"
      >
        {waveformBars.map(([x, y1, y2]) => (
          <line key={x} x1={x} y1={y1} x2={x} y2={y2} />
        ))}
      </g>
    </svg>
  );
}

function PcmWaveform({ pcmData }: { pcmData: Float32Array }) {
  const bars = React.useMemo(() => {
    if (!pcmData || pcmData.length === 0) {
      return Array.from({ length: 28 }, (_, i) => ({
        x: 8 + i * 7.5,
        y1: 47,
        y2: 47,
      }));
    }

    const numBars = 28;
    const samplesPerBar = Math.max(1, Math.floor(pcmData.length / numBars));
    const centerY = 47;
    const maxAmplitude = 40;

    return Array.from({ length: numBars }, (_, i) => {
      const startIdx = i * samplesPerBar;
      const endIdx = Math.min(startIdx + samplesPerBar, pcmData.length);

      let maxVal = 0;
      for (let j = startIdx; j < endIdx; j++) {
        const absVal = Math.abs(pcmData[j]);
        if (absVal > maxVal) maxVal = absVal;
      }

      const amplitude = Math.min(maxAmplitude, maxVal * maxAmplitude * 2);
      const y1 = centerY - amplitude;
      const y2 = centerY + amplitude;

      return {
        x: 8 + i * 7.5,
        y1,
        y2,
      };
    });
  }, [pcmData]);

  return (
    <svg
      className="hidden h-[75px] w-[171px] justify-self-end opacity-70 lg:block"
      viewBox="0 0 214 94"
      aria-hidden="true"
    >
      <g stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
        {bars.map((bar, i) => (
          <line key={i} x1={bar.x} y1={bar.y1} x2={bar.x} y2={bar.y2} />
        ))}
      </g>
    </svg>
  );
}

function AnimatedWaveform({ audioLevel = 0 }: { audioLevel?: number }) {
  const normalizedLevel = Math.max(0, Math.min(1, audioLevel));

  const bars = React.useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => {
      const centerY = 47;
      const maxAmplitude = 40 * normalizedLevel;
      const phase = i * 0.35;
      const randomOffset = Math.sin(phase * 2.1 + i * 0.8) * 0.4 + 0.6;
      const amplitude = maxAmplitude * randomOffset;

      return {
        x: 8 + i * 7.5,
        y1: centerY - amplitude,
        y2: centerY + amplitude,
      };
    });
  }, [normalizedLevel]);

  return (
    <svg
      className="hidden h-[75px] w-[171px] justify-self-end opacity-70 lg:block"
      viewBox="0 0 214 94"
      aria-hidden="true"
    >
      <g stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
        {bars.map((bar, i) => (
          <line key={i} x1={bar.x} y1={bar.y1} x2={bar.x} y2={bar.y2} />
        ))}
      </g>
    </svg>
  );
}

export function NowPlaying({
  songTitle = 'Queue Song',
  artist = 'Unknown Artist',
  albumArt,
  currentTime = '0:00',
  duration = '--:--',
  progress = 65,
  status = 'playing',
  waitLabel,
  attentionKey = 0,
  celebrateKey = 0,
  microphoneLabel,
  audioLevel,
  pcmData,
}: NowPlayingProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const config = stateConfig[status];
  const progressWidth = status === 'playing' ? safeProgress : 0;
  const title = status === 'idle' ? 'No song playing' : songTitle;
  const subtitle =
    status === 'idle' ? config.subtitle : artist || config.subtitle;
  const statusLabel =
    status === 'queued' && waitLabel ? waitLabel : config.statusLabel;
  const attentionStretch = 1.03 + (attentionKey % 2) * 0.01;

  const confettiPieces = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: 8 + ((index * 31) % 84),
        drift: (index % 2 === 0 ? 1 : -1) * (16 + ((index * 7) % 34)),
        delay: (index % 8) * 0.035,
        color: ['#ffffff', '#bef264', '#67e8f9', '#fde68a', '#fda4af'][
          index % 5
        ],
      })),
    [],
  );

  return (
    <m.section
      aria-label={`${config.statusLabel.toLowerCase()} state`}
      data-state={status}
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0,
        scaleX: attentionKey ? [1, 1.01, 1] : 1,
        scaleY: attentionKey ? [1, Math.min(attentionStretch, 1.01), 1] : 1,
      }}
      transition={{
        duration: attentionKey ? 0.45 : 0.22,
        ease: 'easeInOut',
      }}
      className="relative min-h-[246px] w-full origin-center rounded-[17px] px-5 pb-6 pt-16 text-white shadow-[0_18px_40px_rgba(7,18,36,.18),inset_0_1px_0_rgba(255,255,255,.14)] sm:min-h-[234px] sm:px-7 sm:pb-7 lg:min-h-0 lg:h-[186px] lg:px-6 lg:pb-5 lg:pt-14"
      style={
        {
          '--state-color': config.color,
          background: config.background,
        } as React.CSSProperties
      }
    >
      {status === 'playing' && celebrateKey > 0 && (
        <div
          key={celebrateKey}
          className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
          aria-hidden="true"
        >
          {confettiPieces.map((piece) => (
            <m.span
              key={`${celebrateKey}-${piece.id}`}
              className="absolute top-0 h-2 w-1.5 rounded-sm"
              style={{
                left: `${piece.left}%`,
                backgroundColor: piece.color,
              }}
              initial={{ opacity: 0, y: -8, x: 0, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [0, 34, 82, 130],
                x: [0, piece.drift * 0.45, piece.drift],
                rotate: [0, 160, 340],
              }}
              transition={{
                duration: 1.2,
                delay: piece.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}

      <div className="absolute left-6 top-6 inline-flex h-6 max-w-[calc(100%-48px)] items-center gap-2.5 rounded-full bg-white/10 px-3 text-xs font-extrabold uppercase tracking-normal text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)] sm:left-7 lg:left-6 lg:top-5">
        <span
          className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_14px_var(--state-color)]"
          style={{ backgroundColor: config.color }}
          aria-hidden="true"
        />
        <span className="truncate">{statusLabel}</span>
      </div>

      <div className="grid h-full grid-cols-[80px_minmax(0,1fr)] items-center gap-4 pb-14 sm:grid-cols-[96px_minmax(0,1fr)] sm:gap-5 sm:pb-12 lg:grid-cols-[114px_minmax(0,1fr)_171px] lg:gap-5 lg:pb-6">
        <CoverCube
          albumArt={albumArt}
          accentColor={config.color}
          popKey={status === 'playing' ? celebrateKey : 0}
          className="h-20 w-20 sm:h-24 sm:w-24 lg:h-[116px] lg:w-[114px]"
        />

        <div className="min-w-0 self-center lg:pb-5">
          <h3 className="mb-1 break-words text-xl font-extrabold leading-tight tracking-normal text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.3)] lg:text-[19px]">
            {title}
          </h3>
          <p className="mb-3 break-words text-sm font-semibold leading-snug text-white/80 sm:text-base lg:mb-2 lg:text-sm">
            {subtitle}
          </p>
          <div className="inline-flex h-7 max-w-full items-center gap-2 rounded-lg bg-white/15 px-2.5 text-xs font-extrabold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
            <span
              className="h-[7px] w-[7px] shrink-0 rounded-full shadow-[0_0_10px_var(--state-color)]"
              style={{ backgroundColor: config.color }}
              aria-hidden="true"
            />
            <span className="truncate">{config.badge}</span>
          </div>
          {microphoneLabel && (
            <div className="inline-flex h-6 max-w-full items-center gap-1.5 rounded-md bg-blue-600/80 px-2 text-xs font-semibold text-white backdrop-blur-sm">
              <Mic className="h-3 w-3 shrink-0" />
              <span className="truncate">{microphoneLabel}</span>
            </div>
          )}
        </div>

        {pcmData ? (
          <PcmWaveform pcmData={pcmData} />
        ) : microphoneLabel ? (
          <AnimatedWaveform audioLevel={audioLevel} />
        ) : (
          <Waveform />
        )}
      </div>

      <div className="absolute bottom-6 left-6 right-6 grid grid-cols-[41px_minmax(0,1fr)_43px] items-center gap-3 text-sm font-semibold text-white/95 sm:left-7 sm:right-7 sm:text-[15px] lg:bottom-5 lg:left-40 lg:text-sm">
        <span>{status === 'playing' ? currentTime : '0:00'}</span>
        <div className="h-2 overflow-hidden rounded-full bg-white/25 shadow-[inset_0_1px_1px_rgba(0,0,0,.16)]">
          <m.div
            initial={{ width: 0 }}
            animate={{ width: `${progressWidth}%` }}
            transition={{ duration: 0.5 }}
            className="h-full rounded-full bg-white/75"
          />
        </div>
        <span className="text-right">{duration}</span>
      </div>
    </m.section>
  );
}
