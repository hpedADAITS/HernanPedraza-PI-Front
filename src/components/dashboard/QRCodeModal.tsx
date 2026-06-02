import React, { useRef, useEffect, useState, useEffectEvent } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Copy, Download, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { eventsAPI } from '@/services/api/events';
import { t } from '@/i18n';

interface QRCodeModalProps {
  isOpen: boolean;
  accessCode: string;
  onClose: () => void;
  isDj?: boolean;
  eventId?: string;
  onAccessCodeChange?: (newCode: string) => void;
}

export function QRCodeModal({
  isOpen,
  accessCode,
  onClose,
  isDj = false,
  eventId,
  onAccessCodeChange,
}: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const handleClose = useEffectEvent(() => {
    onClose();
  });

  const handleRegenerate = async () => {
    if (!eventId) {
      toast.error(t('Event ID missing'));
      return;
    }
    setRegenerating(true);
    try {
      const event = await eventsAPI.regenerateAccessCode(eventId);
      onAccessCodeChange?.(event.accessCode);
      toast.success(t('Access code regenerated'));
      setShowConfirm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('Failed to regenerate code'));
    } finally {
      setRegenerating(false);
    }
  };

  const error = accessCode ? '' : t('Access code not available');

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast.success(t('Access code copied!'));
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) {
      toast.error(t('QR code is not ready'));
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `event-qr-${accessCode}.svg`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('QR code downloaded!'));
  };

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: 50 }}
            className="fixed inset-0 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
          >
            <m.div
              initial={{ scale: 0.98, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="grid aspect-square w-[min(calc(100vw-2rem),calc(100vh-2rem),30rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-2xl border border-slate-900/10 bg-[radial-gradient(circle_at_72%_20%,rgba(70,156,255,0.08),transparent_24%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.95)]"
            >
              <div className="flex items-center justify-between px-4 pb-2.5 pt-4 sm:px-5 sm:pb-3 sm:pt-5">
                <div>
                  <h2 className="text-[19px] font-black leading-tight tracking-normal text-[#101c3a] sm:text-[22px]">
                    {t('Event QR Code')}
                  </h2>
                  <p className="mt-1 text-xs font-bold leading-snug text-[#73829d]">
                    {t('Scan to join this event.')}
                  </p>
                </div>
                <m.button
                  whileTap={{ scale: 0.99 }}
                  onClick={onClose}
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-slate-900/10 bg-white text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:h-10 sm:w-10"
                  aria-label={t('Close QR code modal')}
                >
                  <X size={20} />
                </m.button>
              </div>

              <div className="flex min-h-0 flex-col gap-2.5 px-4 sm:gap-3 sm:px-5">
                {error ? (
                  <div className="grid flex-1 place-items-center rounded-2xl border border-red-100 bg-red-50 px-4 text-center">
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                  </div>
                ) : (
                  <m.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mx-auto grid aspect-square w-[min(48vw,10rem)] place-items-center rounded-[18px] border border-slate-900/10 bg-white p-2.5 shadow-[0_14px_28px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] sm:w-48 sm:p-3"
                    ref={qrRef}
                  >
                    <QRCode
                      value={accessCode}
                      size={160}
                      level="H"
                      includeMargin={true}
                      className="h-full w-full rounded-lg"
                    />
                  </m.div>
                )}

                <div className="rounded-xl border border-slate-900/10 bg-white px-3 py-2 shadow-[0_10px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] sm:py-2.5">
                  <p className="mb-1 text-[10px] font-extrabold uppercase tracking-normal text-[#73829d]">
                    {t('Access Code')}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <code className="min-w-0 flex-1 truncate text-base font-black tracking-[0.16em] text-[#101c3a] sm:text-lg">
                      {accessCode}
                    </code>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <m.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleCopyCode}
                          className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg text-[#2878ff] transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 sm:h-9 sm:w-9"
                          aria-label={t('Copy access code')}
                        >
                          <Copy size={18} />
                        </m.button>
                      </TooltipTrigger>
                      <TooltipContent>{t('Copy code')}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 px-4 pb-4 pt-2 sm:gap-2 sm:px-5 sm:pb-5 sm:pt-3">
                {isDj && (
                  <m.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setShowConfirm(true)}
                    disabled={regenerating}
                    className="flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-extrabold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-50 sm:h-10 sm:text-sm"
                  >
                    <RefreshCw
                      size={17}
                      className={regenerating ? 'animate-spin' : undefined}
                    />
                    {t('Regenerate Access Code')}
                  </m.button>
                )}
                <div className="flex gap-2">
                  <m.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleDownloadQR}
                    className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-[#2878ff] text-sm font-extrabold text-white shadow-[0_10px_20px_rgba(40,120,255,0.22)] transition-colors hover:bg-[#1f66dc] sm:h-11"
                  >
                    <Download size={18} />
                    {t('Download')}
                  </m.button>
                  <m.button
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={onClose}
                    className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-900/10 bg-white text-sm font-extrabold text-[#17213a] shadow-[0_10px_20px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-slate-50 sm:h-11"
                  >
                    {t('Close')}
                  </m.button>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('Regenerate access code?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('This is a dangerous action. The current access code will stop working immediately. All connected attendees will be notified of the new code, and anyone trying to join with the old code will fail. This cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>{t('Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRegenerate();
              }}
              disabled={regenerating}
              className="bg-red-600 hover:bg-red-700"
            >
              {regenerating ? t('Regenerating...') : t('Yes, regenerate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
