import type React from 'react';
import { m } from 'motion/react';
import { Mic2, Music2 } from 'lucide-react';
import { clsx } from 'clsx';
import { t } from '@/i18n';

interface AttendeeSongSuggestViewProps {
  artist: string;
  isDarkMode: boolean;
  onArtistChange: (artist: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onTitleChange: (title: string) => void;
  submitting: boolean;
  title: string;
}

export function AttendeeSongSuggestView({
  artist,
  isDarkMode,
  onArtistChange,
  onSubmit,
  onTitleChange,
  submitting,
  title,
}: AttendeeSongSuggestViewProps) {
  const isDisabled = submitting || !title.trim() || !artist.trim();
  const cardClassName = clsx(
    'relative mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border p-5 md:p-7',
    isDarkMode
      ? 'border-white/10 bg-[radial-gradient(circle_at_72%_18%,rgba(70,156,255,0.16),transparent_24%),linear-gradient(180deg,#182235_0%,#111827_100%)] text-white shadow-[0_18px_42px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : 'border-slate-900/10 bg-[radial-gradient(circle_at_72%_18%,rgba(16,185,129,0.10),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfffd_100%)] text-slate-900 shadow-[0_18px_42px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );
  const titleClassName = clsx(
    'text-[22px] font-black leading-tight tracking-normal',
    isDarkMode ? 'text-white' : 'text-[#101c3a]',
  );
  const helperClassName = clsx(
    'mt-1.5 text-[13px] font-bold leading-snug tracking-normal',
    isDarkMode ? 'text-slate-300' : 'text-[#73829d]',
  );
  const fieldClassName = clsx(
    'group flex h-[52px] min-w-0 cursor-text items-center gap-3.5 rounded-xl border px-[18px]',
    isDarkMode
      ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md'
      : 'border-slate-900/10 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]',
  );
  const iconClassName = clsx(
    'h-5 w-5 flex-shrink-0 transition-colors group-focus-within:text-emerald-500',
    isDarkMode ? 'text-slate-300' : 'text-[#526990]',
  );
  const inputClassName = clsx(
    'h-full min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold tracking-normal outline-none placeholder:font-normal placeholder:tracking-normal',
    isDarkMode
      ? 'text-white placeholder:text-slate-400'
      : 'text-[#14213f] placeholder:text-[#8b9ab4]',
  );
  const buttonClassName = clsx(
    'mt-1 h-[52px] w-full rounded-xl text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(16,185,129,0.24)] transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100',
    isDisabled
      ? isDarkMode
        ? 'cursor-not-allowed bg-slate-500/70 opacity-80 shadow-[0_10px_20px_rgba(0,0,0,0.18)]'
        : 'cursor-not-allowed bg-slate-400 opacity-80 shadow-[0_10px_20px_rgba(15,23,42,0.08)]'
      : isDarkMode
        ? 'cursor-pointer bg-emerald-500 hover:bg-emerald-600 shadow-[0_10px_20px_rgba(16,185,129,0.20)] focus-visible:ring-emerald-200'
        : 'cursor-pointer bg-emerald-500 hover:bg-emerald-600',
  );

  return (
    <m.form
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onSubmit={onSubmit}
      className={cardClassName}
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
        <h2 className={titleClassName}>{t('Request a track')}</h2>
        <p className={helperClassName}>{t('Add a song suggestion to the DJ queue.')}</p>
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <label className={fieldClassName}>
          <Music2 className={iconClassName} />
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label={t('Song title')}
            placeholder={t('Song title')}
            required
            className={inputClassName}
          />
        </label>

        <label className={fieldClassName}>
          <Mic2 className={iconClassName} />
          <input
            type="text"
            value={artist}
            onChange={(event) => onArtistChange(event.target.value)}
            aria-label={t('Artist')}
            placeholder={t('Artist')}
            required
            className={inputClassName}
          />
        </label>

        <m.button
          type="submit"
          disabled={isDisabled}
          whileHover={isDisabled ? undefined : { y: -1 }}
          whileTap={isDisabled ? undefined : { scale: 0.98 }}
          className={buttonClassName}
        >
          {submitting ? t('Submitting…') : t('Suggest Song')}
        </m.button>
      </div>
    </m.form>
  );
}
