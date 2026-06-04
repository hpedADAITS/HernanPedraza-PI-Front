import { AnimatePresence, m } from 'motion/react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useToastStore, type Toast, type ToastType } from '@/hooks/useToast';

const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500 dark:text-emerald-400',
    text: 'text-emerald-800 dark:text-emerald-200',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500 dark:text-red-400',
    text: 'text-red-800 dark:text-red-200',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
  },
};

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const styles = TOAST_STYLES[toast.type];
  const Icon = TOAST_ICONS[toast.type];

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[320px] max-w-[420px]',
        styles.bg,
        styles.border
      )}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0', styles.icon)} />
      <p className={clsx('flex-1 text-sm font-medium', styles.text)}>{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={clsx(
          'p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          styles.text
        )}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </m.div>
  );
}

interface ToastContainerProps {
  position?: 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right';
}

export function ToastContainer({ position = 'top-center' }: ToastContainerProps) {
  const { toasts, removeToast } = useToastStore();

  const positionClasses: Record<typeof position, string> = {
    'top-center': 'top-4 left-1/2 -translate-x-1/2 flex-col-reverse',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 flex-col',
    'top-right': 'top-4 right-4 flex-col-reverse',
    'bottom-right': 'bottom-4 right-4 flex-col',
  };

  return (
    <div
      className={clsx(
        'fixed z-[1000] pointer-events-none flex gap-2 p-4',
        positionClasses[position]
      )}
      style={{ pointerEvents: 'auto' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Re-export for convenience
export { useToast, useToastStore } from '@/hooks/useToast';
export type { ToastType };