import React, { ReactNode, useEffect, useEffectEvent } from 'react';
import { m, AnimatePresence } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const tapMotion = { scale: 0.99 };
const hoverMotion = { scale: 1.01 };

interface SettingsPageShellProps {
  title: string;
  children: ReactNode;
  backLabel?: string;
  onBack: () => void;
  titleClassName?: string;
}

export function SettingsPageShell({
  title,
  children,
  backLabel = 'Back',
  onBack,
  titleClassName,
}: SettingsPageShellProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-8 flex w-full max-w-4xl flex-col items-center"
    >
      <h1
        className={cn(
          'mb-8 text-center text-4xl font-light text-white md:text-5xl',
          titleClassName,
        )}
      >
        {title}
      </h1>

      {children}

      <div className="fixed bottom-8 right-8 z-50">
        <m.button
          type="button"
          whileHover={hoverMotion}
          whileTap={tapMotion}
          onClick={onBack}
          className="flex h-12 items-center gap-2 rounded-full bg-white px-5 text-base font-medium text-slate-800 shadow-xl transition-shadow hover:shadow-2xl md:h-14 md:px-7 md:text-lg"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          {backLabel}
        </m.button>
      </div>
    </m.div>
  );
}

interface SettingsSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SettingsSearch({
  value,
  onChange,
  placeholder = 'Search settings...',
  className,
}: SettingsSearchProps) {
  return (
    <div className={cn('relative mb-12 w-full max-w-lg md:mb-16', className)}>
      <Search
        size={22}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        aria-label={placeholder}
        placeholder={placeholder}
        className="h-14 w-full rounded-xl border border-white/70 bg-white pl-14 pr-5 text-base text-slate-800 shadow-lg outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-white/40 md:h-16 md:text-lg"
      />
    </div>
  );
}

interface SettingsGridProps {
  children: ReactNode;
  className?: string;
}

export function SettingsGrid({ children, className }: SettingsGridProps) {
  return (
    <div className={cn('grid w-full grid-cols-1 gap-5 md:grid-cols-2', className)}>
      {children}
    </div>
  );
}

interface SettingsOptionCardProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  iconOnly?: boolean;
  className?: string;
}

export function SettingsOptionCard({
  label,
  onClick,
  icon: Icon,
  iconOnly = false,
  className,
}: SettingsOptionCardProps) {
  return (
    <m.button
      type="button"
      whileHover={hoverMotion}
      whileTap={tapMotion}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-700 shadow-md transition-all hover:border-slate-200 hover:shadow-xl',
        iconOnly
          ? 'aspect-square text-slate-300'
          : Icon
            ? 'min-h-44 flex-col gap-4 px-5 py-8 text-lg font-semibold md:min-h-56 md:text-xl'
            : 'h-24 px-5 text-lg font-semibold md:h-24 md:text-xl',
        className,
      )}
      aria-label={label}
    >
      {Icon && iconOnly ? (
        <Icon
          size={76}
          strokeWidth={1.6}
          aria-hidden="true"
        />
      ) : Icon ? (
        <>
          <Icon
            size={76}
            strokeWidth={1.6}
            className="text-slate-300"
            aria-hidden="true"
          />
          <span>{label}</span>
        </>
      ) : (
        label
      )}
    </m.button>
  );
}

interface SettingsListProps {
  children: ReactNode;
  className?: string;
}

export function SettingsList({ children, className }: SettingsListProps) {
  return (
    <div className={cn('flex w-full max-w-2xl flex-col gap-3', className)}>
      {children}
    </div>
  );
}

interface SettingsListItemProps {
  label: string;
  onClick: () => void;
  index?: number;
}

export function SettingsListItem({
  label,
  onClick,
  index = 0,
}: SettingsListItemProps) {
  return (
    <m.button
      type="button"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={hoverMotion}
      whileTap={tapMotion}
      onClick={onClick}
      className="flex h-16 items-center justify-center rounded-xl border border-slate-100 bg-white px-5 text-center text-lg font-medium text-slate-700 shadow-sm transition-all hover:border-slate-200 hover:bg-slate-50 hover:shadow-md md:h-20 md:text-xl"
    >
      {label}
    </m.button>
  );
}

interface SettingsDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SettingsDialog({
  open,
  title,
  onClose,
  children,
}: SettingsDialogProps) {
  const closeDialog = useEffectEvent(() => {
    onClose();
  });

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDialog();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
        >
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            onClick={(event) => event.stopPropagation()}
            className="grid aspect-square w-[min(calc(100vw-2rem),calc(100vh-2rem),30rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-slate-900/10 bg-[radial-gradient(circle_at_72%_20%,rgba(70,156,255,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]"
          >
            <div className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
              <div className="min-w-0">
                <h2 className="truncate text-[20px] font-black leading-tight tracking-normal text-[#101c3a] sm:text-[22px]">
                  {title}
                </h2>
                <p className="mt-1 text-xs font-bold leading-snug text-[#73829d]">
                  Manage this setting for your current session.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:h-10 sm:w-10"
                aria-label={`Close ${title}`}
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="flex min-h-full flex-col justify-center">
                {children}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

interface SettingsDialogActionsProps {
  children: ReactNode;
  className?: string;
}

export function SettingsDialogActions({
  children,
  className,
}: SettingsDialogActionsProps) {
  return (
    <div className={cn('mt-6 flex gap-3', className)}>
      {children}
    </div>
  );
}

interface SettingsDialogButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export function SettingsDialogButton({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  className,
}: SettingsDialogButtonProps) {
  return (
    <m.button
      type="button"
      whileTap={tapMotion}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-11 flex-1 rounded-xl px-4 text-sm font-extrabold shadow-[0_10px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary'
          ? 'bg-[#2878ff] text-white shadow-[0_10px_20px_rgba(40,120,255,0.22)] hover:bg-[#1f66dc]'
          : 'border border-slate-900/10 bg-white text-[#17213a] hover:bg-slate-50',
        className,
      )}
    >
      {children}
    </m.button>
  );
}

interface SettingsChoiceRowProps {
  children: ReactNode;
  selected?: boolean;
  onClick: () => void;
}

export function SettingsChoiceRow({
  children,
  selected = false,
  onClick,
}: SettingsChoiceRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold shadow-[0_8px_16px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors',
        selected
          ? 'border-blue-200 bg-blue-50 text-[#2878ff]'
          : 'border-slate-900/10 bg-white text-[#17213a] hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

interface SettingsToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

export function SettingsToggleRow({
  label,
  checked,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-900/10 bg-white px-4 py-3 shadow-[0_8px_16px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-slate-50">
      <span className="text-sm font-semibold text-[#17213a]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="h-5 w-5 flex-shrink-0 accent-[#2878ff]"
      />
    </label>
  );
}
