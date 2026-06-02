import { m } from 'motion/react';
import { Clock } from 'lucide-react';
import { formatCooldownRemaining } from '@/constants/cooldowns';
import { t } from '@/i18n';

interface AttendeeCooldownOverlayProps {
  remainingMs: number;
}

export function AttendeeCooldownOverlay({ remainingMs }: AttendeeCooldownOverlayProps) {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[999999] grid place-items-center bg-emerald-950/45 px-6 text-white backdrop-blur-[2px] backdrop-saturate-50"
      style={{ backgroundColor: 'rgba(6, 78, 59, 0.52)' }}
    >
      <div className="flex max-w-sm flex-col items-center rounded-xl border border-white/20 bg-slate-950/70 px-7 py-6 text-center shadow-2xl">
        <Clock className="mb-3 h-8 w-8 text-emerald-300" />
        <p className="text-sm font-bold uppercase tracking-normal text-emerald-200">
          {t('Request cooldown')}
        </p>
        <p className="mt-2 text-4xl font-black tabular-nums tracking-normal">
          {formatCooldownRemaining(remainingMs)}
        </p>
        <p className="mt-3 text-sm font-semibold text-slate-200">
          {t('The DJ paused your song requests.')}
        </p>
      </div>
    </m.div>
  );
}
